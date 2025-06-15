  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => mockUseAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isAdmin).toBe(false)
    })
  })
