import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  Settings, 
  Home, 
  User, 
  Link, 
  Monitor, 
  HelpCircle,
  Github,
  Twitter,
  Instagram,
  Youtube,
  Globe
} from 'lucide-react';
import Image from 'next/image';

export default function UserPageDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,69,198,0.3)_0%,transparent_50%)] pointer-events-none" />
      
      {/* Top Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        {/* Left: Profile info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 ring-2 ring-purple-400/50">
            <AvatarImage src="https://via.placeholder.com/150" alt="Profile" />
            <AvatarFallback className="bg-purple-600 text-white text-2xl">U</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-white">ユーザー名</h1>
            <Badge variant="secondary" className="text-sm bg-purple-600/20 text-purple-200 border-purple-400/30 mt-1">
              レベル 42
            </Badge>
          </div>
        </div>
        
        {/* Right: Action buttons */}
        <div className="flex items-center gap-5">
          <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 p-5">
            <Bell className="h-16 w-16" />
          </Button>
          <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 p-5">
            <Mail className="h-16 w-16" />
          </Button>
          <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 p-5">
            <Settings className="h-16 w-16" />
          </Button>
        </div>
      </div>

      {/* Banner Area */}
      <div className="absolute top-32 right-6 w-80 h-20 z-10">
        <Card className="h-full bg-black/20 border-purple-400/30 overflow-hidden">
          <div className="relative h-full">
            <Image 
              src="https://via.placeholder.com/320x80/6366f1/ffffff?text=Banner"
              alt="Banner"
              fill
              className="object-cover"
            />
          </div>
        </Card>
      </div>

      {/* Left Side: SNS Links */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
        {[
          { icon: Github, color: 'hover:bg-gray-700/50' },
          { icon: Twitter, color: 'hover:bg-blue-500/50' },
          { icon: Instagram, color: 'hover:bg-pink-500/50' },
          { icon: Youtube, color: 'hover:bg-red-500/50' },
          { icon: Globe, color: 'hover:bg-green-500/50' }
        ].map((social, index) => (
          <Button 
            key={index}
            size="lg" 
            variant="ghost" 
            className={`p-4 text-white/70 hover:text-white ${social.color} border border-white/20 rounded-full h-16 w-16`}
          >
            <social.icon className="h-8 w-8" />
          </Button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex items-end justify-center min-h-screen px-20 pb-0">
        <Card className="bg-black/20 border-purple-400/30 p-8 backdrop-blur-sm mb-0">
          <div className="relative w-96 h-[648px] mx-auto">
            <Image
              src="https://via.placeholder.com/384x648/8b5cf6/ffffff?text=Character+Image+9:16"
              alt="Character"
              fill
              className="object-cover rounded-lg"
            />
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-6 right-6 flex gap-4 z-10">
        {[
          { icon: Home, label: 'Home' },
          { icon: User, label: 'Profile' },
          { icon: Link, label: 'Links' },
          { icon: Monitor, label: 'Device' },
          { icon: HelpCircle, label: 'FAQ' }
        ].map((nav, index) => (
          <Button 
            key={index}
            size="lg" 
            variant="ghost" 
            className="flex flex-col items-center gap-2 text-white/70 hover:text-white hover:bg-white/10 p-4 h-auto min-w-20"
          >
            <nav.icon className="h-8 w-8" />
            <span className="text-sm font-medium">{nav.label}</span>
          </Button>
        ))}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1000" />
      <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-500" />
    </div>
  );
}