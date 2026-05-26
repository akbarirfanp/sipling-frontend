import { http, HttpResponse } from 'msw'

// Mock API handlers for testing
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any
    const { email, password, tenantId } = body

    // Mock successful login
    if (email === 'admin@example.com' && password === 'password123' && tenantId) {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          roles: ['admin'],
          permissions: ['users:read', 'users:write', 'admin:access'],
          tenantId,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      })
    }

    // Mock regular user login
    if (email === 'user@example.com' && password === 'password123' && tenantId) {
      return HttpResponse.json({
        user: {
          id: '2',
          email: 'user@example.com',
          name: 'Regular User',
          roles: ['user'],
          permissions: ['users:read'],
          tenantId,
        },
        accessToken: 'mock-user-token',
        refreshToken: 'mock-user-refresh',
      })
    }

    // Mock invalid credentials
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 },
    )
  }),

  http.get('/api/auth/session', () => {
    // Mock authenticated session
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin'],
        permissions: ['users:read', 'users:write', 'admin:access'],
        tenantId: 'test-tenant',
      },
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  // Users endpoints
  http.get('/api/users', ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    return HttpResponse.json([
      {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin'],
      },
      {
        id: '2',
        email: 'user@example.com',
        name: 'Regular User',
        roles: ['user'],
      },
    ])
  }),

  // Admin endpoints
  http.get('/api/admin/users', ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    // Mock admin-only access
    if (authHeader.includes('mock-user-token')) {
      return HttpResponse.json(
        { error: 'Forbidden' },
        { status: 403 },
      )
    }

    return HttpResponse.json([
      {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin'],
        permissions: ['users:read', 'users:write', 'admin:access'],
      },
      {
        id: '2',
        email: 'user@example.com',
        name: 'Regular User',
        roles: ['user'],
        permissions: ['users:read'],
      },
    ])
  }),

  // Genesys integration endpoints
  http.get('/api/genesys/agents', ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    return HttpResponse.json([
      {
        id: 'agent-1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'available',
        skills: ['sales', 'support'],
      },
      {
        id: 'agent-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'busy',
        skills: ['technical', 'escalation'],
      },
    ])
  }),

  http.post('/api/genesys/conversations', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await request.json() as any

    return HttpResponse.json({
      id: 'conv-123',
      customerId: body.customerId,
      agentId: body.agentId,
      status: 'active',
      createdAt: new Date().toISOString(),
    })
  }),
]
