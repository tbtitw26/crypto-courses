// app/api/auth/register/route.ts - User registration API endpoint

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendRegistrationConfirmationEmail } from '@/lib/email'
import { isAllowedCountryCode } from '@/lib/countries'

function resolveRegistrationLocale(request: NextRequest): 'en' | 'ar' {
  const cookieLocale = request.cookies.get('user_locale')?.value
  if (cookieLocale === 'en' || cookieLocale === 'ar') {
    return cookieLocale
  }

  const acceptLanguage = request.headers.get('accept-language')?.toLowerCase() || ''
  if (acceptLanguage.includes('ar')) {
    return 'ar'
  }

  return 'en'
}

export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set in environment variables')
      return NextResponse.json(
        { error: 'DATABASE_CONFIGURATION_ERROR' },
        { status: 503 }
      )
    }

    // Log database connection info for debugging (without password)
    const dbUrl = process.env.DATABASE_URL
    const dbUrlInfo = {
      hasUrl: true,
      format: dbUrl.includes('@') 
        ? dbUrl.split('@')[1]?.split('/')[0] || 'unknown'
        : 'invalid',
      hasPooling: dbUrl.includes('pooler') || dbUrl.includes('pgbouncer'),
      isPostgres: dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'),
    }
    console.log('Database connection info:', dbUrlInfo)

    // Test database connection before proceeding (only in development for debugging)
    if (process.env.NODE_ENV === 'development') {
      try {
        await prisma.$connect()
        console.log('Database connection test: SUCCESS')
      } catch (connectError: any) {
        console.error('Database connection test: FAILED', {
          code: connectError?.code,
          name: connectError?.name,
          message: connectError?.message,
        })
        // Don't throw here, let the actual query fail for better error handling
        // This is just for diagnostic purposes
      }
    }

    const body = await request.json()
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const dateOfBirth = typeof body.dateOfBirth === 'string' ? body.dateOfBirth.trim() : ''
    const street = typeof body.street === 'string' ? body.street.trim() : ''
    const city = typeof body.city === 'string' ? body.city.trim() : ''
    const country = typeof body.country === 'string' ? body.country.trim().toUpperCase() : ''
    const postalCode = typeof body.postalCode === 'string' ? body.postalCode.trim() : ''
    const acceptTerms = body.acceptTerms === true

    // Validation
    if (!firstName || !email || !password || !phone || !dateOfBirth || !street || !city || !country || !postalCode) {
      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      )
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: 'TERMS_NOT_ACCEPTED' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL' },
        { status: 400 }
      )
    }

    const parsedDateOfBirth = new Date(`${dateOfBirth}T00:00:00.000Z`)
    if (Number.isNaN(parsedDateOfBirth.getTime())) {
      return NextResponse.json(
        { error: 'INVALID_DATE_OF_BIRTH' },
        { status: 400 }
      )
    }

    if (!isAllowedCountryCode(country)) {
      return NextResponse.json(
        { error: 'INVALID_COUNTRY' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      })
    } catch (dbError: any) {
      console.error('Database query error (findUnique):', {
        code: dbError?.code,
        name: dbError?.name,
        message: dbError?.message,
        meta: dbError?.meta,
      })
      throw dbError // Re-throw for general error handling
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'EMAIL_EXISTS' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    let user
    try {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName || null,
          date_of_birth: parsedDateOfBirth,
          phone,
          bill_address: street,
          bill_city: city,
          bill_country: country,
          bill_postal: postalCode,
          balance: 0,
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      })
    } catch (dbError: any) {
      console.error('Database query error (create):', {
        code: dbError?.code,
        name: dbError?.name,
        message: dbError?.message,
        meta: dbError?.meta,
      })
      throw dbError // Re-throw for general error handling
    }

    const locale = resolveRegistrationLocale(request)
    try {
      await sendRegistrationConfirmationEmail({
        userEmail: user.email,
        userName: user.first_name,
        locale,
      })
    } catch (emailError: any) {
      console.error('Registration confirmation email failed:', {
        userId: user.id,
        email: user.email,
        locale,
        message: emailError?.message,
        stack: emailError?.stack,
      })
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error('Registration error:', {
      code: error?.code,
      name: error?.name,
      message: error?.message,
      meta: error?.meta,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    })

    // IMPORTANT: Check specific errors FIRST, before general database errors
    // 1. Check if it's a unique constraint violation (email already exists)
    if (error?.code === 'P2002' || error?.meta?.target?.includes('email')) {
      return NextResponse.json(
        { error: 'EMAIL_EXISTS' },
        { status: 409 }
      )
    }

    // 2. Check if it's a database connection error (specific Prisma connection error codes)
    const isConnectionError =
      error?.code === 'P1001' || // Can't reach database server
      error?.code === 'P1002' || // Database server doesn't accept connection
      error?.code === 'P1003' || // Database name not found
      error?.code === 'P1008' || // Operations timed out
      error?.code === 'P1009' || // Database already exists
      error?.code === 'P1010' || // Database access denied
      error?.code === 'P1011' || // TLS connection error
      error?.code === 'P1017' || // Server has closed the connection
      error?.code === 'P1018' || // Value for the connection limit reached
      error?.name === 'PrismaClientInitializationError' ||
      error?.name === 'PrismaClientConnectionError' ||
      (error?.message?.toLowerCase().includes('connection') &&
        (error?.message?.toLowerCase().includes('timeout') ||
          error?.message?.toLowerCase().includes('refused') ||
          error?.message?.toLowerCase().includes('failed'))) ||
      (error?.message?.toLowerCase().includes("can't reach database") ||
        error?.message?.toLowerCase().includes("can not reach database") ||
        error?.message?.toLowerCase().includes('connection string') ||
        error?.message?.toLowerCase().includes('connection pool'))

    if (isConnectionError) {
      return NextResponse.json(
        { error: 'DATABASE_UNAVAILABLE' },
        { status: 503 } // Service Unavailable
      )
    }

    // 3. Check for other database-related errors (table/relation not found, etc.)
    const isDatabaseError =
      error?.code?.startsWith('P') || // Other Prisma error codes
      error?.message?.includes('does not exist') ||
      error?.message?.includes('relation') ||
      error?.message?.includes('table') ||
      (error?.message?.toLowerCase().includes('database') &&
        !error?.message?.toLowerCase().includes('unique'))

    if (isDatabaseError) {
      // For development, include more details
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message:
            process.env.NODE_ENV === 'development'
              ? error?.message || 'Database operation failed'
              : 'Database operation failed',
        },
        { status: 503 }
      )
    }

    // 4. Generic error handler
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development'
            ? error?.message || 'An unexpected error occurred'
            : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

