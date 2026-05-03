import { Link } from 'react-router-dom'

function CTASection() {
  return (
    <section className="overflow-hidden bg-surface-container-low py-16 md:py-20">
      <div className="container mx-auto px-8">
        <div className="relative flex flex-col items-center overflow-hidden rounded-[3rem] bg-primary p-10 text-center md:p-16">
          <div
            className="absolute inset-0 opacity-10"
            data-alt="abstract geometric pattern of interlocking health symbols and soft glowing lines on dark background"
          ></div>
          <div className="relative z-10 max-w-3xl">
            <h2 className="mb-8 text-4xl font-headline font-extrabold text-white md:text-6xl">Ready for a healthier tomorrow?</h2>
            <p className="mb-12 text-xl text-primary-fixed/80">
              Join over 50,000 users who trust MediCare as their empathetic health guardian.
            </p>
            <div className="flex flex-col justify-center gap-6 sm:flex-row">
              <Link
                className="group rounded-2xl border border-white/40 bg-gradient-to-r from-secondary-fixed to-secondary-container px-10 py-5 text-lg font-bold text-on-secondary-fixed shadow-[0_12px_30px_-12px_rgba(0,110,28,0.65)] transition-all duration-300 hover:-translate-y-1 hover:saturate-125 hover:shadow-[0_20px_44px_-16px_rgba(0,110,28,0.8)] active:scale-95"
                to="/registration"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection
