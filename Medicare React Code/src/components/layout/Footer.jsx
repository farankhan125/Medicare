import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-surface py-10 md:py-12 border-t border-outline-variant/10">
      <div className="container mx-auto px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 md:gap-10 mb-10 md:mb-12">
          <div>
            <span className="text-3xl font-black text-primary font-headline tracking-tighter block mb-4">MediCare</span>
            <p className="text-on-surface-variant max-w-xs mb-6">
              The sophisticated medical companion designed for humans, powered by intelligence.
            </p>
            <div className="flex gap-4">
              <a
                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-lg">share</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-lg">public</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-lg">alternate_email</span>
              </a>
            </div>
          </div>

          <div className="w-full lg:max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            <div>
              <h4 className="font-bold text-primary mb-4">Platform</h4>
              <ul className="space-y-3 text-on-surface-variant text-sm">
                <li>
                  <a className="hover:text-primary" href="#">
                    Features
                  </a>
                </li>
                <li>
                  <a className="hover:text-primary" href="#">
                    AI Assistant
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-4">Company</h4>
              <ul className="space-y-3 text-on-surface-variant text-sm">
                <li>
                  <a className="hover:text-primary" href="#">
                    About Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-4">Support</h4>
              <ul className="space-y-3 text-on-surface-variant text-sm">
                <li>
                  <Link className="hover:text-primary" to="/privacy-policy">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-outline-variant/10 flex flex-col md:flex-row justify-center gap-4">
          <p className="text-sm text-outline font-medium text-center">© {new Date().getFullYear()} MediCare Systems Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
