import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/app/components/PublicLayout";
import { getPublicScheduleSlots } from "@/lib/schedule";
import styles from "@/app/public-site.module.css";

export const dynamic = "force-dynamic";

export default async function VitaminaDLaCopiiPage() {
  const schedule = await getPublicScheduleSlots();

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <article className={styles.articlePage}>
        <Link className={styles.inlineLink} href="/ghiduri-medicale">
          <ArrowLeft size={16} /> Înapoi la articole
        </Link>
        <p className={styles.eyebrow}>Articol</p>
        <h1>Vitamina D la copii - rol, simptomele deficitului și importanța pentru sănătatea inimii</h1>
        <p className={styles.articleLead}>
          Vitamina D este unul dintre cei mai importanți nutrienți pentru creșterea și dezvoltarea armonioasă a copilului.
          Deși este cunoscută în special pentru rolul său în sănătatea oaselor, cercetările din ultimii ani au demonstrat
          că aceasta contribuie și la funcționarea normală a sistemului imunitar, a musculaturii și, într-o anumită măsură,
          a sistemului cardiovascular.
        </p>

        <div className={styles.articleContent}>
          <p>
            Deficitul de vitamina D rămâne frecvent întâlnit la copii, inclusiv în România, motiv pentru care prevenția
            și identificarea precoce sunt importante.
          </p>

          <h2>Ce este vitamina D?</h2>
          <p>
            Vitamina D este o vitamină liposolubilă produsă în principal la nivelul pielii sub acțiunea razelor ultraviolete B
            (UVB). O cantitate mai mică provine din alimentație și din suplimente.
          </p>
          <p>Sursele alimentare includ:</p>
          <ul>
            <li>peștele gras (somon, macrou, sardine);</li>
            <li>ficatul;</li>
            <li>gălbenușul de ou;</li>
            <li>produsele lactate și cerealele fortificate.</li>
          </ul>
          <p>
            În majoritatea situațiilor, alimentația singură nu acoperă necesarul zilnic al copilului, motiv pentru care
            suplimentarea este recomandată în anumite grupe de vârstă și la copiii cu factori de risc.
          </p>

          <h2>De ce este importantă vitamina D?</h2>
          <p>Vitamina D are numeroase funcții în organism:</p>
          <ul>
            <li>favorizează absorbția calciului și fosforului;</li>
            <li>contribuie la dezvoltarea normală a oaselor și dinților;</li>
            <li>previne apariția rahitismului;</li>
            <li>susține dezvoltarea și funcționarea musculaturii;</li>
            <li>participă la funcționarea normală a sistemului imunitar;</li>
            <li>contribuie la menținerea funcției normale a mai multor organe, inclusiv a inimii.</li>
          </ul>

          <h2>Vitamina D și sănătatea cardiovasculară</h2>
          <p>
            Receptori pentru vitamina D au fost identificați la nivelul mușchiului cardiac, al vaselor de sânge și al unor
            celule implicate în reglarea funcției cardiovasculare. Acest lucru sugerează că vitamina D are un rol în
            menținerea funcției normale a aparatului cardiovascular.
          </p>
          <p>
            Studiile au arătat că deficitul de vitamina D este asociat cu o frecvență mai mare a unor afecțiuni
            cardiovasculare, precum hipertensiunea arterială sau insuficiența cardiacă. Totuși, aceste asocieri nu demonstrează
            că deficitul este cauza directă a bolii și nici că administrarea suplimentelor de vitamina D previne apariția bolilor
            cardiovasculare la copiii sănătoși.
          </p>
          <p>
            În prezent, ghidurile internaționale recomandă suplimentarea vitaminei D pentru prevenirea și tratamentul deficitului,
            nu ca metodă de prevenție cardiovasculară.
          </p>

          <h2>Vitamina D și sistemul electric al inimii</h2>
          <p>
            Vitamina D influențează indirect activitatea electrică a inimii prin rolul său în menținerea echilibrului calciului
            și magneziului, electroliți esențiali pentru generarea și conducerea impulsului electric cardiac.
          </p>
          <p>În deficitul sever, în special atunci când apare hipocalcemia, pot fi întâlnite:</p>
          <ul>
            <li>modificări ale electrocardiogramei (ECG);</li>
            <li>prelungirea intervalului QT;</li>
            <li>predispoziție la tulburări de ritm;</li>
            <li>scăderea contractilității miocardice.</li>
          </ul>
          <p>
            Aceste manifestări sunt rare la copii și apar aproape exclusiv în formele severe de deficit sau în rahitismul
            carențial netratat. În prezent, nu există dovezi care să susțină administrarea vitaminei D pentru prevenirea
            aritmiilor la copiii fără deficit documentat.
          </p>

          <h2>Care copii au risc mai mare de deficit?</h2>
          <p>Riscul este crescut la:</p>
          <ul>
            <li>sugarii alimentați exclusiv la sân fără suplimentare;</li>
            <li>copiii cu expunere redusă la soare;</li>
            <li>copiii cu piele închisă la culoare;</li>
            <li>copiii cu obezitate;</li>
            <li>copiii cu boli digestive care determină malabsorbție (boala celiacă, boala Crohn, fibroza chistică);</li>
            <li>copiii cu afecțiuni hepatice sau renale cronice;</li>
            <li>copiii tratați pe termen lung cu anticonvulsivante sau glucocorticoizi.</li>
          </ul>

          <h2>Simptomele deficitului de vitamina D</h2>
          <p>În multe cazuri, deficitul este asimptomatic.</p>
          <p>Atunci când apar manifestări clinice, acestea pot include:</p>
          <ul>
            <li>oboseală;</li>
            <li>slăbiciune musculară;</li>
            <li>dureri osoase sau musculare;</li>
            <li>întârzierea mersului;</li>
            <li>întârzierea dezvoltării motorii;</li>
            <li>crampe musculare;</li>
            <li>iritabilitate;</li>
            <li>transpirații excesive ale capului la sugar (semn nespecific);</li>
            <li>fracturi după traumatisme minore.</li>
          </ul>
          <p>În formele severe poate apărea rahitismul, caracterizat prin:</p>
          <ul>
            <li>întârzierea închiderii fontanelei;</li>
            <li>deformări ale membrelor inferioare;</li>
            <li>mărirea încheieturilor;</li>
            <li>deformări ale cutiei toracice;</li>
            <li>întârzierea erupției dentare;</li>
            <li>tulburări de creștere.</li>
          </ul>

          <h2>Când este necesară dozarea vitaminei D?</h2>
          <p>
            Determinarea concentrației serice de 25-hidroxivitamina D nu este recomandată de rutină tuturor copiilor sănătoși.
          </p>
          <p>Analiza este indicată în special la copiii cu:</p>
          <ul>
            <li>suspiciune clinică de deficit;</li>
            <li>rahitism;</li>
            <li>fracturi repetate;</li>
            <li>boli cronice asociate cu risc de deficit;</li>
            <li>sindroame de malabsorbție;</li>
            <li>tratamente medicamentoase care influențează metabolismul vitaminei D.</li>
          </ul>
          <p>
            Rezultatul trebuie interpretat împreună cu examenul clinic și, atunci când este necesar, cu alte investigații precum
            calciul, fosforul, fosfataza alcalină și parathormonul.
          </p>

          <h2>Cum poate fi prevenit deficitul?</h2>
          <p>Prevenția include:</p>
          <ul>
            <li>administrarea profilactică a vitaminei D la sugari conform recomandărilor medicului;</li>
            <li>alimentație echilibrată;</li>
            <li>activitate fizică în aer liber;</li>
            <li>expunere moderată și responsabilă la soare;</li>
            <li>suplimentare la copiii cu factori de risc, conform indicației medicale.</li>
          </ul>

          <h2>Este periculos excesul de vitamina D?</h2>
          <p>Da. Administrarea unor doze mari fără recomandare medicală poate determina intoxicație cu vitamina D și hipercalcemie.</p>
          <p>Manifestările pot include:</p>
          <ul>
            <li>greață și vărsături;</li>
            <li>constipație;</li>
            <li>sete excesivă;</li>
            <li>urinări frecvente;</li>
            <li>slăbiciune;</li>
            <li>afectare renală în cazurile severe.</li>
          </ul>

          <h2>Când este recomandat consultul medical?</h2>
          <p>Adresați-vă medicului dacă:</p>
          <ul>
            <li>copilul prezintă simptome sugestive pentru deficit de vitamina D;</li>
            <li>există întârzieri în dezvoltare;</li>
            <li>apar dureri osoase sau fracturi repetate;</li>
            <li>copilul are o boală cronică asociată cu risc de deficit;</li>
            <li>aveți întrebări privind necesitatea suplimentării sau interpretarea analizelor.</li>
          </ul>

          <h2>Concluzii</h2>
          <p>
            Vitamina D este esențială pentru dezvoltarea sănătoasă a copilului, având un rol bine demonstrat în metabolismul
            osos și în funcționarea sistemului muscular și imunitar. Dovezile actuale sugerează că aceasta contribuie și la
            funcționarea normală a sistemului cardiovascular, însă suplimentarea este recomandată pentru prevenirea și tratamentul
            deficitului de vitamina D și nu ca metodă de prevenție a bolilor cardiovasculare sau a tulburărilor de ritm.
          </p>
          <p>
            Evaluarea medicală rămâne esențială pentru stabilirea necesității investigațiilor și a dozei corecte de suplimentare
            pentru fiecare copil.
          </p>

          <h2>Bibliografie</h2>
          <ol>
            <li>
              Demay MB, et al. Vitamin D for the Prevention of Disease: Endocrine Society Clinical Practice Guideline. Journal
              of Clinical Endocrinology &amp; Metabolism. 2024.
            </li>
            <li>
              Corsello A, et al. Vitamin D in Pediatric Age: Current Evidence, Recommendations and Misunderstandings. Frontiers
              in Medicine. 2023.
            </li>
            <li>
              Pludowski P, et al. Clinical Practice in the Prevention, Diagnosis and Treatment of Vitamin D Deficiency. Nutrients. 2023.
            </li>
            <li>Pilz S, et al. Vitamin D and Cardiovascular Disease. Circulation Research. 2016.</li>
            <li>American Academy of Pediatrics. Recommendations for Prevention of Rickets and Vitamin D Deficiency in Infants, Children, and Adolescents.</li>
          </ol>
        </div>
      </article>
      <PublicFooter schedule={schedule} />
    </main>
  );
}
