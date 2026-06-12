import { useTranslations } from "next-intl";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
export default function PrivacyPolicyPage() {
  const t = useTranslations("Common");
  return <main className="bg-background text-foreground min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-24 md:py-32">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center rounded-full border border-ca-accent/30 bg-ca-accent/10 px-2.5 py-0.5 text-xs font-semibold font-mono text-ca-accent transition-colors">{t("legalCompliance")}</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">{t("privacyPolicy")}</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">{t("lastUpdatedJune2026")}</p>
        </div>

        <div className="prose prose-invert prose-ca max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("1Introduction")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("welcometoCredAxiswe")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("2InformationWeCollect")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("whenyouuseCredAxis")}</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>{t("walletAddresses")}</strong>{t("yourpublicblockchainaddress")}</li>
              <li><strong>{t("academicData")}</strong>{t("hashesofyouracademic")}</li>
              <li><strong>{t("contactInformation")}</strong>{t("emailaddressesprovidedduring")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("3HowWeUse")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("weusethecollected")}</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>{t("issueandverifyyour")}</li>
              <li>{t("providemaintainandimprove")}</li>
              <li>{t("notifyyouregardingaccount")}</li>
              <li>{t("complywithlegaland")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("4BlockchainandImmutability")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("pleasenotethatCredAxis")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("5CookiesandTracking")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("weusecookiesto")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">{t("6ContactUs")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("ifyouhaveany")}</p>
          </section>
        </div>
      </div>

      <Footer />
    </main>;
}