/**
 * Privacy Policy Page
 */
import React from 'react';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-300 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
          <p className="text-gray-300 mb-4">We collect the following types of information:</p>
          <ul className="text-gray-300 list-disc pl-6 space-y-2">
            <li>Account information (email, name, phone number)</li>
            <li>Identity verification documents (for KYC)</li>
            <li>Transaction history</li>
            <li>Device and browser information</li>
            <li>IP addresses and location data</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
          <ul className="text-gray-300 list-disc pl-6 space-y-2">
            <li>To provide and maintain our services</li>
            <li>To verify your identity and prevent fraud</li>
            <li>To comply with legal and regulatory requirements</li>
            <li>To communicate with you about your account</li>
            <li>To improve our services</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">3. Data Security</h2>
          <p className="text-gray-300">
            We implement industry-standard security measures to protect your personal information,
            including encryption, secure servers, and regular security audits.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">4. Data Retention</h2>
          <p className="text-gray-300">
            We retain your personal data for as long as necessary to provide our services
            and comply with legal obligations. Transaction records are kept for 7 years.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">5. Your Rights</h2>
          <p className="text-gray-300 mb-4">You have the right to:</p>
          <ul className="text-gray-300 list-disc pl-6 space-y-2">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal requirements)</li>
            <li>Object to processing of your data</li>
            <li>Data portability</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">6. Contact</h2>
          <p className="text-gray-300">
            For privacy-related inquiries, please contact our Data Protection Officer at privacy@cryptoexchange.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
