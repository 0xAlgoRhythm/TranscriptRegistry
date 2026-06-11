"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react"

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // A basic handler to give UI feedback before standard HTML form submission
  // Or handle it asynchronously
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "YOUR_WEB3FORMS_ACCESS_KEY"
    formData.append("access_key", accessKey)
    
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setIsSuccess(true)
        e.currentTarget.reset()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setIsSuccess(false), 5000)
    }
  }

  return (
    <section className="relative overflow-hidden py-24 md:py-32" id="contact">
      {/* Background Meshes */}
      <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,rgba(114,28,190,0.08),transparent_50%)]" />
      <div className="absolute bottom-0 left-0 h-full w-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(108,91,240,0.05),transparent_50%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-16 md:grid-cols-2 md:gap-8 lg:gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-ca-accent/30 bg-ca-accent/10 px-3 py-1 text-xs font-medium tracking-wide text-ca-accent uppercase">
              <MessageSquare className="h-3.5 w-3.5" />
              Get In Touch
            </div>
            
            <h2 className="text-4xl font-display font-light md:text-5xl lg:text-6xl">
              Ready to <br />
              <strong className="font-semibold text-foreground">Integrate?</strong>
            </h2>
            
            <p className="max-w-md text-muted-foreground leading-relaxed">
              Whether you are an institution looking to onboard, or an employer looking for API access to our verification endpoints, we are here to help you get started.
            </p>

            <div className="pt-4 flex flex-col gap-4">
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ca-accent/20 text-ca-accent">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Us</p>
                  <p className="text-sm font-medium">info@credaxis.app</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xl relative overflow-hidden">
              {/* Form Glow */}
              <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-ca-accent opacity-[0.07] blur-3xl" />
              
              <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name / Organization</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="w-full rounded-lg border border-border bg-ca-surface-2 px-4 py-3 text-sm outline-none transition-colors focus:border-ca-accent focus:bg-ca-surface text-foreground"
                    placeholder="University of Examples"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Work Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="w-full rounded-lg border border-border bg-ca-surface-2 px-4 py-3 text-sm outline-none transition-colors focus:border-ca-accent focus:bg-ca-surface text-foreground"
                    placeholder="admin@university.edu"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">How can we help?</label>
                  <textarea
                    name="message"
                    id="message"
                    required
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border bg-ca-surface-2 px-4 py-3 text-sm outline-none transition-colors focus:border-ca-accent focus:bg-ca-surface text-foreground"
                    placeholder="We want to start issuing immutable transcripts..."
                  ></textarea>
                </div>

                <input type="hidden" name="subject" value="New CredAxis Partnership Inquiry" />
                <input type="hidden" name="from_name" value="CredAxis Web3Forms" />

                <Button
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                  className="w-full bg-ca-accent hover:bg-ca-accent-hover text-white py-6"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">Sending...</span>
                  ) : isSuccess ? (
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Message Sent!</span>
                  ) : (
                    <span className="flex items-center gap-2">Send Message <ArrowRight className="h-4 w-4" /></span>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
