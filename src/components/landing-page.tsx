'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Shield, Users, BarChart3, Settings, ArrowRight, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Client Portal</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="grid gap-4 py-6">
                    <Link href="/sign-in" className="flex w-full items-center py-2 text-lg font-semibold">
                      Sign In
                    </Link>
                    <Link href="/sign-up" className="flex w-full items-center py-2 text-lg font-semibold">
                      Get Started
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Modern Client Portal
                <span className="block text-blue-600">Built for Teams</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Streamline your workflow with role-based access, powerful dashboards,
                and seamless collaboration tools designed for modern teams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/sign-up" className="flex items-center">
                    Get Started Today <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Everything You Need
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Powerful features designed to enhance productivity and collaboration
                across different user roles and responsibilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Role-Based Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Secure, granular permissions for Admin, Manager, and Client roles
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Real-time insights and reporting tools for data-driven decisions
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Seamless communication and project management tools
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Easy Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Intuitive admin tools for user and system management
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Role Cards Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Built for Every Role
              </h2>
              <p className="text-gray-600">
                Tailored experiences for different user types and responsibilities
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Admin</Badge>
                    <Shield className="h-4 w-4" />
                  </div>
                  <CardTitle>Administrator</CardTitle>
                  <CardDescription>
                    Full system access and user management capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• User management and role assignment</li>
                    <li>• System configuration and settings</li>
                    <li>• Complete analytics and reporting</li>
                    <li>• All project and document access</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Manager</Badge>
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <CardTitle>Manager</CardTitle>
                  <CardDescription>
                    Oversee projects, manage teams, and track progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Assign tasks and manage workflows</li>
                    <li>• Monitor team performance and KPIs</li>
                    <li>• Access project-specific dashboards</li>
                    <li>• Collaborate with clients and teams</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Badge>Client</Badge>
                    <Users className="h-4 w-4" />
                  </div>
                  <CardTitle>Client</CardTitle>
                  <CardDescription>
                    Access project updates, documents, and communication
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• View project progress and milestones</li>
                    <li>• Access and download shared documents</li>
                    <li>• Communicate with the project team</li>
                    <li>• Submit and track support requests</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t mt-16">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <p className="text-gray-500">&copy; 2024 Client Portal. All rights reserved.</p>
              <div className="flex space-x-6">
                <Link href="#" className="text-gray-500 hover:text-gray-600">Privacy</Link>
                <Link href="#" className="text-gray-500 hover:text-gray-600">Terms</Link>
                <Link href="#" className="text-gray-500 hover:text-gray-600">Contact</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
} 