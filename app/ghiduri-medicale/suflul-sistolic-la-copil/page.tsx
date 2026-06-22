import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/app/components/PublicLayout";
import { getPublicScheduleSlots } from "@/lib/schedule";
import styles from "@/app/public-site.module.css";

export const dynamic = "force-dynamic";

export default async function SuflulSistolicPage() {
  const schedule = await getPublicScheduleSlots();

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <article className={styles.articlePage}>
        <Link className={styles.inlineLink} href="/ghiduri-medicale">
          <ArrowLeft size={16} /> Înapoi la ghiduri
        </Link>
        <p className={styles.eyebrow}>Ghid medical</p>
        <h1>Suflul sistolic la copil - trebuie să ne îngrijorăm?</h1>
        <p className={styles.articleLead}>
          Mulți părinți se sperie atunci când aud pentru prima dată că medicul a identificat un suflu cardiac
          la copilul lor. În realitate, un suflu cardiac nu înseamnă automat că există o problemă a inimii.
        </p>

        <div className={styles.articleContent}>
          <h2>Ce este un suflu sistolic?</h2>
          <p>
            Suflul sistolic este un zgomot suplimentar auzit de medic cu stetoscopul în timpul sistolei,
            adică în momentul în care inima se contractă și pompează sângele către organism și plămâni.
            Acest sunet apare din cauza circulației turbulente a sângelui prin inimă sau prin vasele mari.
          </p>
          <p>
            Suflul în sine nu reprezintă un diagnostic, ci un semn clinic care necesită interpretare în
            contextul fiecărui copil.
          </p>

          <h2>Ce tipuri de sufluri sistolice există?</h2>
          <h3>Suflul funcțional sau inocent</h3>
          <p>
            Suflul funcțional apare la o inimă normală, fără defecte structurale. Este foarte frecvent în
            copilărie și poate fi auzit la copii perfect sănătoși.
          </p>
          <p>Caracteristici:</p>
          <ul>
            <li>copilul nu prezintă simptome;</li>
            <li>creșterea și dezvoltarea sunt normale;</li>
            <li>intensitatea suflului poate varia în timp;</li>
            <li>nu necesită tratament.</li>
          </ul>
          <p>
            Acest tip de suflu poate deveni mai evident în perioade de febră, emoții, efort fizic sau creștere rapidă.
          </p>

          <h3>Suflul organic</h3>
          <p>
            Suflul organic este determinat de o modificare structurală a inimii sau a vaselor mari. Acesta
            poate apărea în cadrul unor malformații cardiace congenitale sau al altor afecțiuni cardiace.
          </p>
          <p>
            În aceste situații, medicul poate recomanda investigații suplimentare, precum electrocardiograma
            (EKG) și ecocardiografia, pentru stabilirea diagnosticului.
          </p>

          <h2>Când este recomandată evaluarea cardiologică?</h2>
          <p>O consultație de cardiologie pediatrică este utilă atunci când:</p>
          <ul>
            <li>suflul este descoperit pentru prima dată;</li>
            <li>medicul pediatru recomandă o evaluare suplimentară;</li>
            <li>copilul prezintă oboseală excesivă, dificultăți la efort sau alimentație;</li>
            <li>apar palpitații, dureri toracice sau episoade de pierdere a cunoștinței;</li>
            <li>există antecedente familiale de boli cardiace.</li>
          </ul>

          <h2>Cum se stabilește dacă suflul este funcțional sau organic?</h2>
          <p>
            Diferențierea se face prin examen clinic și, atunci când este necesar, prin ecocardiografie.
            Aceasta permite vizualizarea structurilor cardiace și excluderea sau confirmarea unei afecțiuni cardiace.
          </p>

          <h2>Mesaj pentru părinți</h2>
          <p>
            Majoritatea suflurilor cardiace întâlnite la copii sunt funcționale și apar la inimi sănătoase.
            Totuși, evaluarea cardiologică este importantă pentru a stabili cu certitudine natura suflului și
            pentru a oferi familiei liniștea necesară.
          </p>
          <p>
            Un suflu cardiac nu înseamnă automat o boală de inimă, dar merită întotdeauna evaluat corect.
          </p>
        </div>
      </article>
      <PublicFooter schedule={schedule} />
    </main>
  );
}
