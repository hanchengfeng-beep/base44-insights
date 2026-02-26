import React from 'react'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPageUrl } from '@/utils'
import { Link } from 'react-router-dom'

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="text-6xl font-bold text-slate-900">404</div>
        <h1 className="text-3xl font-bold text-slate-800">Page Not Found</h1>
        <p className="text-slate-600 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
        <Link to={createPageUrl('Home')}>
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}