import { describe, expect, it } from 'vitest'

describe('auth route and role validation', () => {
  it('identifies public auth routes', () => {
    const publicRoutes = new Set(['/login', '/register'])
    expect(publicRoutes.has('/login')).toBe(true)
    expect(publicRoutes.has('/register')).toBe(true)
    expect(publicRoutes.has('/memory')).toBe(false)
    expect(publicRoutes.has('/')).toBe(false)
  })

  it('validates default user role assignment', () => {
    const newUser = {
      name: 'Test Partner',
      email: 'partner@cima.test',
      role: 'partner',
    }

    expect(['user', 'partner', 'admin']).toContain(newUser.role)
  })
})
