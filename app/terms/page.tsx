"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-bold text-[#0A2C57] mb-4">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing and using the Longo Training App and Admin Dashboard (the &quot;Services&quot;), 
              you accept and agree to be bound by the terms and provision of this agreement. If you 
              do not agree to abide by the above, please do not use these services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">2. Use License</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Permission is granted to temporarily use the Services for authorized business and 
              training purposes only. This is the grant of a license, not a transfer of title, 
              and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Modify or copy the materials or software</li>
              <li>Use the materials for any unauthorized commercial purpose</li>
              <li>Attempt to reverse engineer, decompile, or disassemble any software</li>
              <li>Remove any copyright or other proprietary notations</li>
              <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">3. User Account</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You are responsible for maintaining the confidentiality of your account credentials and 
              for all activities that occur under your account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Provide accurate and complete information when creating an account</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Not share your account credentials with others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You agree not to use the Services to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others, including intellectual property rights</li>
              <li>Transmit any harmful, offensive, or illegal content</li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>Attempt to gain unauthorized access to any portion of the Services</li>
              <li>Use automated systems to access the Services without authorization</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">5. Training Content</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All training materials, modules, quizzes, and content provided in the Services are the 
              property of Longo Carpet Cleaning and are protected by copyright laws. You may not 
              reproduce, distribute, create derivative works from, or publicly display this content 
              without express written permission from Longo Carpet Cleaning.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">6. Admin Dashboard Access</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Access to the Admin Dashboard is restricted to authorized administrators only. 
              Administrators are responsible for maintaining the security and confidentiality of 
              user data and must comply with all applicable privacy laws and regulations. Unauthorized 
              access or misuse of administrative privileges may result in immediate termination of 
              access and legal action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">7. Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The materials in the Services are provided on an &apos;as is&apos; basis. Longo Carpet Cleaning 
              makes no warranties, expressed or implied, and hereby disclaims and negates all other 
              warranties including, without limitation, implied warranties or conditions of merchantability, 
              fitness for a particular purpose, or non-infringement of intellectual property or other 
              violation of rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">8. Limitations</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In no event shall Longo Carpet Cleaning or its suppliers be liable for any damages 
              (including, without limitation, damages for loss of data or profit, or due to business 
              interruption) arising out of the use or inability to use the Services, even if Longo 
              Carpet Cleaning or a Longo Carpet Cleaning authorized representative has been notified 
              orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">9. Account Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right to terminate or suspend your account and access to the Services 
              immediately, without prior notice or liability, for any reason whatsoever, including 
              without limitation if you breach the Terms. You may also delete your account at any 
              time through the app settings (for mobile app users) or by contacting your administrator 
              (for admin dashboard users).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
              If a revision is material, we will try to provide at least 30 days notice prior to any new 
              terms taking effect. What constitutes a material change will be determined at our sole 
              discretion. By continuing to access or use our Services after those revisions become effective, 
              you agree to be bound by the revised terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#0A2C57] mb-4">11. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 font-semibold mb-2">Longo Carpet Cleaning</p>
              <p className="text-gray-700">Email: </p>
              <p className="text-gray-700">Address:</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
