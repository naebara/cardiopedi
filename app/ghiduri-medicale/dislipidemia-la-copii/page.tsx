import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/app/components/PublicLayout";
import { getPublicScheduleSlots } from "@/lib/schedule";
import styles from "@/app/public-site.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dislipidemia la copii – depistare precoce | Cardiopedi",
  description:
    "Află când se recomandă profilul lipidic la copii, care sunt valorile orientative și de ce diagnosticul precoce al dislipidemiei este important.",
};

export default async function DislipidemiaLaCopiiPage() {
  const schedule = await getPublicScheduleSlots();

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <article className={styles.articlePage}>
        <Link className={styles.inlineLink} href="/ghiduri-medicale">
          <ArrowLeft size={16} /> Înapoi la articole
        </Link>
        <p className={styles.eyebrow}>Articol</p>
        <h1>Dislipidemia la copii – de ce este importantă depistarea precoce?</h1>
        <p style={{ color: "#1d6f9f", fontWeight: 700, margin: "0 0 18px" }}>
          Autor: Dr. Mihaela Bădulescu – Medic specialist Cardiologie Pediatrică și Pediatrie
        </p>
        <p className={styles.articleLead}>
          Mulți părinți consideră că valorile crescute ale colesterolului reprezintă o problemă exclusiv a adulților.
          În realitate, modificările profilului lipidic pot apărea încă din copilărie și, netratate, pot favoriza
          dezvoltarea precoce a aterosclerozei și a bolilor cardiovasculare la vârsta adultă.
        </p>

        <div className={styles.articleContent}>
          <p>
            Studiile arată că procesul de ateroscleroză începe încă din primele două decenii de viață, iar identificarea
            timpurie a copiilor cu dislipidemie poate reduce semnificativ riscul cardiovascular pe termen lung. (JACC)
          </p>

          <h2>Ce este dislipidemia?</h2>
          <p>Dislipidemia reprezintă modificarea valorilor normale ale grăsimilor din sânge (lipidelor), cel mai frecvent:</p>
          <ul>
            <li>creșterea colesterolului LDL („colesterolul rău”);</li>
            <li>scăderea colesterolului HDL („colesterolul bun”);</li>
            <li>creșterea trigliceridelor;</li>
            <li>creșterea colesterolului total sau a colesterolului non-HDL.</li>
          </ul>
          <p>În copilărie, cele mai frecvente cauze sunt:</p>
          <ul>
            <li>predispoziția genetică (hipercolesterolemia familială);</li>
            <li>obezitatea și excesul ponderal;</li>
            <li>alimentația bogată în grăsimi saturate și zaharuri;</li>
            <li>sedentarismul;</li>
            <li>diabetul zaharat, bolile renale, hipotiroidismul sau alte afecțiuni cronice.</li>
          </ul>

          <h2>Când trebuie testat colesterolul?</h2>
          <p>Conform recomandărilor actuale:</p>
          <ul>
            <li>toți copiii ar trebui să efectueze un profil lipidic între 9 și 11 ani, iar ulterior între 17 și 21 de ani;</li>
            <li>
              copiii cu risc crescut (antecedente familiale de hipercolesterolemie sau boală cardiovasculară precoce,
              obezitate, diabet, hipertensiune arterială, boală renală cronică sau alte afecțiuni asociate) trebuie
              investigați începând cu vârsta de 2 ani. (JACC)
            </li>
          </ul>

          <h2>Care sunt valorile considerate normale?</h2>
          <p>La copil, valorile orientative sunt:</p>
          <ul>
            <li>colesterol total: &lt;170 mg/dL;</li>
            <li>LDL-colesterol: &lt;110 mg/dL;</li>
            <li>HDL-colesterol: &gt;45 mg/dL;</li>
            <li>trigliceride sub 10 ani: &lt;75 mg/dL;</li>
            <li>trigliceride între 10 și 19 ani: &lt;90 mg/dL.</li>
          </ul>
          <p>
            Valorile aflate peste aceste limite necesită evaluare medicală și interpretare în contextul clinic al fiecărui
            copil. (JACC)
          </p>

          <h2>Hipercolesterolemia familială – cea mai importantă cauză genetică</h2>
          <p>
            Hipercolesterolemia familială este una dintre cele mai frecvente boli genetice, afectând aproximativ 1 din
            250–300 de persoane. Copiii afectați prezintă valori foarte crescute ale LDL-colesterolului încă din primii ani
            de viață și dezvoltă ateroscleroză mult mai devreme dacă nu sunt diagnosticați și tratați. (JACC)
          </p>
          <p>
            Dacă unul dintre părinți are hipercolesterolemie familială sau a suferit infarct miocardic la vârstă tânără,
            este recomandată evaluarea tuturor copiilor din familie și, atunci când este disponibilă, testarea genetică.
            (PubMed Central – PMC)
          </p>

          <h2>Cum se tratează?</h2>
          <h3>1. Modificarea stilului de viață – primul pas</h3>
          <p>La majoritatea copiilor, tratamentul începe prin:</p>
          <ul>
            <li>alimentație echilibrată, bogată în fructe, legume și cereale integrale;</li>
            <li>limitarea grăsimilor saturate și a produselor ultraprocesate;</li>
            <li>reducerea băuturilor îndulcite și a excesului de zahăr;</li>
            <li>activitate fizică zilnică (minimum 60 de minute);</li>
            <li>controlul greutății corporale.</li>
          </ul>
          <p>Aceste măsuri reprezintă baza tratamentului pentru orice copil cu dislipidemie. (JACC)</p>

          <h3>2. Tratamentul medicamentos</h3>
          <p>Nu toți copiii au nevoie de medicamente.</p>
          <p>
            Statinele sunt recomandate în special copiilor cu hipercolesterolemie familială sau cu valori persistent
            crescute ale LDL-colesterolului, după 3–6 luni de măsuri privind stilul de viață, de regulă începând de la
            vârsta de 8 ani. În anumite forme genetice severe, tratamentul poate fi inițiat mai devreme, în centre
            specializate. (JACC)
          </p>

          <h2>De ce este important diagnosticul precoce?</h2>
          <p>Copiii cu dislipidemie nu prezintă, de cele mai multe ori, simptome. De aceea, screeningul este esențial.</p>
          <p>Depistarea și tratamentul precoce:</p>
          <ul>
            <li>reduc expunerea organismului la valori crescute ale colesterolului;</li>
            <li>încetinesc dezvoltarea aterosclerozei;</li>
            <li>scad riscul de infarct miocardic și accident vascular cerebral la vârsta adultă;</li>
            <li>permit identificarea altor membri ai familiei care pot avea aceeași afecțiune genetică. (JACC)</li>
          </ul>

          <h2>Mesaj pentru părinți</h2>
          <p>
            Un simplu profil lipidic poate identifica precoce copiii cu risc cardiovascular crescut. Dacă există antecedente
            familiale de colesterol crescut, infarct miocardic la vârstă tânără sau dacă copilul este supraponderal ori are
            alte boli asociate, nu amânați evaluarea. Diagnosticul precoce și intervenția la timp pot face diferența pentru
            sănătatea cardiovasculară a copilului dumneavoastră pe termen lung.
          </p>
          <p>
            <strong>
              Acest articol are caracter informativ și nu înlocuiește consultația medicală de specialitate. Interpretarea
              analizelor și recomandările terapeutice trebuie individualizate pentru fiecare copil.
            </strong>
          </p>
        </div>
      </article>
      <PublicFooter schedule={schedule} />
    </main>
  );
}
