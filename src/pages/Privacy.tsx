import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";

const Privacy = () => {
  return (
    <Layout>
      <SEOHead
        title="Privacy Policy | FoodFam"
        description="Learn how FoodFam collects, uses, and protects your personal information."
      />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <p className="text-foreground font-medium">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              1. Information We Collect
            </h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Account information (name, email, password)</li>
              <li>Profile information (bio, location, languages)</li>
              <li>Content you post (experiences, reviews, messages)</li>
              <li>Booking and transaction information</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              2. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process bookings and facilitate experiences</li>
              <li>Send you updates and marketing communications</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              3. Information Sharing
            </h2>
            <p>
              We share your information with other users as necessary to facilitate experiences 
              (e.g., sharing your name with a host when you book). We do not sell your personal 
              information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              4. Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              5. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              6. Cookies
            </h2>
            <p>
              We use cookies and similar technologies to provide and improve our services, 
              analyze usage, and personalize content.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              7. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at privacy@foodfam.com.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
