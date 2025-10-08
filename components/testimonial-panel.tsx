import { Star } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function TestimonialPanel() {
  return (
    <div className="lg:w-1/2 bg-[#0A0A0A] p-8 lg:p-12 flex flex-col justify-center">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-[#D4AF37]">JarvisDaily</h1>
        </div>

        {/* Star Rating */}
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-6 h-6 fill-[#D4AF37] text-[#D4AF37]" />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="text-white text-2xl lg:text-3xl font-medium mb-8 leading-relaxed">
          "JarvisDaily significantly boosted my client engagement."
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 bg-[#D4AF37]">
            <AvatarFallback className="bg-[#D4AF37] text-[#0A0A0A] font-semibold">VP</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-white font-semibold">Vidya Patel</div>
            <div className="text-gray-400 text-sm">Financial Advisor, Mumbai</div>
          </div>
        </div>
      </div>
    </div>
  )
}
