import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";

const Terms = () => {
  return (
    <Layout>
      <SEOHead
        title="Terms of Service | FoodFam"
        description="Read the FoodFam terms of service and user agreement."
      />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <p className="text-foreground font-medium">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using FoodFam, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              2. Description of Service
            </h2>
            <p>
              FoodFam is a community platform that connects people through food experiences. 
              Users can host and attend home-cooked meals, cooking classes, and cultural food events.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              3. User Accounts
            </h2>
            <p>
              You must create an account to use certain features of FoodFam. You are responsible 
              for maintaining the confidentiality of your account credentials and for all activities 
              that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              4. User Conduct
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Use the platform for any unlawful purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false or misleading information</li>
              <li>Violate any applicable food safety regulations</li>
              <li>Attempt to circumvent platform fees or policies</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              5. Host Responsibilities
            </h2>
            <p>
              Hosts are responsible for ensuring their food experiences comply with local health 
              and safety regulations. Hosts must accurately represent their offerings and maintain 
              a safe environment for guests.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              6. Guest Responsibilities
            </h2>
            <p>
              Guests must communicate any dietary restrictions or allergies before attending an 
              experience. Guests should treat hosts and their homes with respect.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              7. Limitation of Liability
            </h2>
            <p>
              FoodFam is not liable for any damages arising from your use of the platform or 
              participation in experiences. Users participate at their own risk.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              8. Contact Us
            </h2>
            <p>
              If you have questions about these Terms, please contact us at support@foodfam.com.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
