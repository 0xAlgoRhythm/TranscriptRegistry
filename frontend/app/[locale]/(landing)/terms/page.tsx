import { useTranslations } from "next-intl";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
export default function TermsAndConditionsPage() {
  const t = useTranslations("Common");
  return <main className="bg-background text-foreground min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-24 md:py-32">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center rounded-full border border-ca-accent/30 bg-ca-accent/10 px-2.5 py-0.5 text-xs font-semibold font-mono text-ca-accent transition-colors">{t("legalCompliance")}</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">{t("termsConditions")}</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">{t("lastUpdatedJune2026")}</p>
        </div>

        <div className="prose prose-invert prose-ca max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("1AcceptanceofTerms")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("byaccessingandusing")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("2ServiceDescription")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("credAxisprovidesablockchainbased")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("3UserResponsibilities")}</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>{t("security")}</strong>{t("youareentirelyresponsible")}</li>
              <li><strong>{t("accuracy")}</strong>{t("universityregistrarsareresponsible")}</li>
              <li><strong>{t("compliance")}</strong>{t("youagreenotto")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("4ImmutabilityandData")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("byusingourservice")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("5LimitationofLiability")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("credAxisprovidesthePlatform")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("6Modificationstothe")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("wereservetheright")}</p>
          </section>
        </div>
      </div>

      <Footer />
    </main>;
}