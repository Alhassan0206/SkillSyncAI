import MarketingLayout from "@/components/MarketingLayout";
import { Link } from "wouter";

export default function Privacy() {
  const lastUpdated = "November 30, 2024";

  return (
    <MarketingLayout>
      <section className="pt-16 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="p-6 bg-muted rounded-lg mb-8">
              <p className="text-sm text-muted-foreground m-0">
                At SkillSync AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">1. Information We Collect</h2>
              
              <h3 className="font-semibold text-lg mb-2">1.1 Information You Provide</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect information you voluntarily provide when using our Service:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li><strong>Account Information:</strong> Name, email address, password, profile photo</li>
                <li><strong>Profile Data:</strong> Resume, work history, education, skills, certifications</li>
                <li><strong>Job Seeker Data:</strong> Career preferences, salary expectations, location preferences</li>
                <li><strong>Employer Data:</strong> Company information, job postings, hiring criteria</li>
                <li><strong>Communications:</strong> Messages, feedback, support requests</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed by Stripe)</li>
              </ul>

              <h3 className="font-semibold text-lg mb-2">1.2 Information Collected Automatically</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you access our Service, we automatically collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
                <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
              </ul>

              <h3 className="font-semibold text-lg mb-2">1.3 Information from Third Parties</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may receive information from third-party services you connect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>LinkedIn:</strong> Profile data, work history, connections (with your consent)</li>
                <li><strong>GitHub:</strong> Repository information, contribution history</li>
                <li><strong>Google:</strong> Calendar availability for interview scheduling</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Service Delivery:</strong> Provide, maintain, and improve our platform</li>
                <li><strong>AI Matching:</strong> Analyze skills and match candidates with opportunities</li>
                <li><strong>Personalization:</strong> Customize your experience and recommendations</li>
                <li><strong>Communication:</strong> Send notifications, updates, and marketing (with consent)</li>
                <li><strong>Analytics:</strong> Understand usage patterns and improve our services</li>
                <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security threats</li>
                <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">3. AI and Machine Learning</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our AI systems process your data to provide core features:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li><strong>Skill Analysis:</strong> Extract and categorize skills from resumes and profiles</li>
                <li><strong>Match Scoring:</strong> Calculate compatibility between candidates and jobs</li>
                <li><strong>Learning Recommendations:</strong> Suggest courses and resources for skill development</li>
                <li><strong>Content Generation:</strong> Create match explanations and career insights</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We use OpenAI's services for certain AI features. Data sent to OpenAI is subject to their privacy policy. We do not use your data to train AI models without explicit consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">4. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>With Employers/Candidates:</strong> When you apply for jobs or express interest</li>
                <li><strong>Service Providers:</strong> Third parties who help us operate (hosting, analytics, payment processing)</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement robust security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Encryption in transit (TLS/SSL) and at rest (AES-256)</li>
                <li>Two-factor authentication (2FA) option for all accounts</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and employee training</li>
                <li>Secure data centers with SOC 2 compliance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We retain your data for as long as necessary to provide our services:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days; some retained for legal compliance</li>
                <li><strong>Backup Data:</strong> Removed from backups within 90 days of deletion</li>
                <li><strong>Analytics Data:</strong> Aggregated, anonymized data may be retained indefinitely</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">7. Your Rights (GDPR)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you are in the European Economic Area (EEA), you have the following rights:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Restriction:</strong> Request limitation of processing</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, contact us at privacy@skillsync.ai. We will respond within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">8. California Privacy Rights (CCPA)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                California residents have additional rights under the CCPA:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Know:</strong> What personal information we collect and how it's used</li>
                <li><strong>Delete:</strong> Request deletion of your personal information</li>
                <li><strong>Opt-Out:</strong> Opt out of the sale of personal information (we do not sell data)</li>
                <li><strong>Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">9. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar technologies:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Essential Cookies:</strong> Required for basic functionality (authentication, security)</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You can manage cookie preferences through your browser settings. Disabling certain cookies may affect functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">10. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data may be transferred to and processed in countries outside your residence. We ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission, for transfers from the EEA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">11. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for individuals under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">12. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of material changes via email or through the Service. Your continued use after changes become effective constitutes acceptance of the revised policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For privacy-related questions or to exercise your rights:
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  <strong>SkillSync AI - Privacy Team</strong><br />
                  Email: privacy@skillsync.ai<br />
                  Address: 123 Innovation Way, San Francisco, CA 94105<br />
                  Data Protection Officer: dpo@skillsync.ai
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">14. Supervisory Authority</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you are in the EEA and believe we have not adequately addressed your concerns, you have the right to lodge a complaint with your local data protection supervisory authority.
              </p>
            </section>

            {/* Quick Links */}
            <div className="mt-12 p-6 bg-muted rounded-lg">
              <h3 className="font-semibold mb-4">Related Documents</h3>
              <div className="flex flex-wrap gap-4">
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
                <Link href="/contact" className="text-primary hover:underline">Contact Us</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

