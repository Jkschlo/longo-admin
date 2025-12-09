"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/login"
          className="inline-flex items-center text-[#6EC1E4] hover:text-[#5bb7de] mb-8"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Login
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-3xl font-bold text-[#0A2C57] mb-4">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Longo Carpet Cleaning (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the Longo Training App and 
              Admin Dashboard (the &quot;Services&quot;). This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-[#0A2C57] mb-3 mt-6">2.1 Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Name and email address</li>
              <li>Profile information (first name, last name, role assignments)</li>
              <li>Training progress, quiz scores, and completion data</li>
              <li>Account credentials (stored securely using industry-standard encryption)</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#0A2C57] mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you use the Services, we may automatically collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Device information (device type, operating system, browser type)</li>
              <li>Usage data (features accessed, time spent, pages viewed)</li>
              <li>Authentication tokens (for session management)</li>
              <li>IP address and location data (for security purposes)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Provide, maintain, and improve the Services</li>
              <li>Track training progress and completion</li>
              <li>Authenticate your identity and manage your account</li>
              <li>Send you important updates about the Services</li>
              <li>Respond to your inquiries and provide support</li>
              <li>Generate analytics and reports (admin dashboard)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your data is stored securely using Supabase, a cloud-based platform with industry-standard 
              security measures including encryption at rest and in transit. We implement appropriate 
              technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We do not sell, trade, or rent your personal information to third parties. We may share 
              your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or court orders</li>
              <li>To protect our rights, property, or safety, or that of our users</li>
              <li>With service providers who assist in operating the Services (e.g., Supabase, hosting providers)</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">6. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Withdraw consent for data processing</li>
              <li>Export your data in a portable format</li>
              <li>Object to certain types of data processing</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise these rights, please contact us or use the account deletion feature in the 
              app settings (for mobile app users) or contact your administrator (for admin dashboard users).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to track activity on our Services and 
              hold certain information. You can instruct your browser to refuse all cookies or to 
              indicate when a cookie is being sent. However, if you do not accept cookies, you may 
              not be able to use some portions of our Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Services are not intended for children under the age of 13. We do not knowingly 
              collect personal information from children under 13. If you believe we have collected 
              information from a child under 13, please contact us immediately and we will take 
              steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your information may be transferred to and maintained on computers located outside of 
              your state, province, country, or other governmental jurisdiction where data protection 
              laws may differ. By using the Services, you consent to the transfer of your information 
              to our facilities and those third parties with whom we share it as described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. 
              You are advised to review this Privacy Policy periodically for any changes. Changes 
              to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 font-semibold mb-2">Longo Carpet Cleaning</p>
              <p className="text-gray-700">Email: [Your Contact Email]</p>
              <p className="text-gray-700">Address: [Your Business Address]</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
