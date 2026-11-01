import type { Metadata } from "next";
import type { ReactNode } from "react";

// Källtext: docs/juridik/integritetspolicy.md. Ändra båda samtidigt.

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description: "Vilka personuppgifter HP Lift behandlar, varför och vilka rättigheter du har.",
};

const CONTACT = "oholmgren32@gmail.com";
const UPDATED = "1 november 2026";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-3">
      <h2 className="font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">{children}</p>;
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[var(--ink-soft)]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** Tabell som kort på mobil och rader på större skärmar. */
function Rows({ rows }: { rows: { title: string; fields: [string, ReactNode][] }[] }) {
  return (
    <div className="divide-y divide-[var(--line)] rounded-[10px] border border-[var(--line)] bg-card/70">
      {rows.map((row) => (
        <div key={row.title} className="space-y-1.5 p-4">
          <p className="text-sm font-semibold text-[var(--ink)]">{row.title}</p>
          <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[9rem_1fr]">
            {row.fields.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-[var(--ink-muted)]">{label}</dt>
                <dd className="text-[var(--ink-soft)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

const Mail = () => (
  <a href={`mailto:${CONTACT}`} className="font-medium text-[var(--brand)] hover:underline">
    {CONTACT}
  </a>
);

export default function IntegritetspolicyPage() {
  return (
    <article className="mx-auto max-w-[760px] space-y-8">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Integritetspolicy
        </h1>
        <p className="text-sm text-[var(--ink-muted)]">Senast uppdaterad {UPDATED}</p>
        <P>
          Här förklarar vi vilka personuppgifter HP Lift behandlar, varför vi gör det och vilka rättigheter du
          har.
        </P>
      </header>

      <Section id="ansvarig" title="1. Vem ansvarar för dina uppgifter?">
        <P>
          Personuppgiftsansvarig är Oscar Holmgren. Den som är personuppgiftsansvarig avgör hur och varför
          uppgifterna behandlas. När HP Lifts bolag är bildat tar det över ansvaret, och då uppdaterar vi
          policyn.
        </P>
        <P>
          Kontakt i frågor om personuppgifter: <Mail />
        </P>
      </Section>

      <Section id="utan-konto" title="2. Använda appen utan konto">
        <P>
          Du kan öva i HP Lift utan att logga in. Då sparas dina resultat, din veckoplan, dina flashcards och
          dina inställningar bara i din egen webbläsare. De skickas inte till oss. Du raderar dem genom att
          rensa webbläsarens data, eller med knappen ”Rensa lokal data” på profilsidan.
        </P>
        <P>
          För att visa sidan måste vår webbhotelltjänst ta emot din IP-adress och teknisk information om
          webbläsaren (se avsnitt 7).
        </P>
      </Section>

      <Section id="konto" title="3. Vilka uppgifter behandlar vi när du har ett konto?">
        <Rows
          rows={[
            {
              title: "Kontouppgifter",
              fields: [
                ["Exempel", "E-postadress, lösenord (lagras som krypterad hash), namn och eventuell profilbild från Google om du loggar in med Google, när kontot skapades"],
                ["Varför", "För att du ska kunna logga in"],
                ["Rättslig grund", "Avtal: för att tillhandahålla tjänsten du har bett om"],
              ],
            },
            {
              title: "Profil",
              fields: [
                ["Exempel", "Användarnamn, visningsnamn"],
                ["Varför", "Visas i dueller, topplistor och forumet"],
                ["Rättslig grund", "Avtal"],
              ],
            },
            {
              title: "Studiedata",
              fields: [
                ["Exempel", "Övningsresultat, provresultat, historik, veckoplan, repetitionskort, vilka frågor du har sett"],
                ["Varför", "Så att dina framsteg följer med mellan enheter"],
                ["Rättslig grund", "Avtal"],
              ],
            },
            {
              title: "Dueller och topplista",
              fields: [
                ["Exempel", "Matcher, svar, tider, ELO-poäng, vinster och förluster, veckans XP, betyg och anmälningar efter en duell"],
                ["Varför", "För att dueller och topplistor ska fungera och för att stoppa fusk"],
                ["Rättslig grund", "Avtal; berättigat intresse (fusk och missbruk)"],
              ],
            },
            {
              title: "Forum",
              fields: [
                ["Exempel", "Inlägg, röster, anmälningar, rykte"],
                ["Varför", "För att forumet ska fungera och kunna modereras"],
                ["Rättslig grund", "Avtal; berättigat intresse (moderering)"],
              ],
            },
            {
              title: "Rapporter om frågor",
              fields: [
                ["Exempel", "Fråga och din motivering"],
                ["Varför", "För att rätta fel i frågebanken"],
                ["Rättslig grund", "Berättigat intresse"],
              ],
            },
            {
              title: "Önskemål och felrapporter",
              fields: [
                ["Exempel", "Kategori, rubrik, beskrivning, och ditt konto om du är inloggad"],
                ["Varför", "För att förbättra appen"],
                ["Rättslig grund", "Berättigat intresse"],
              ],
            },
          ]}
        />
      </Section>

      <Section id="studiehjalp" title="4. Studiehjälp: när du ansöker om att bli expert">
        <P>Studiehjälp är just nu en pilot. Bara du som är 18 år eller äldre kan ansöka.</P>
        <P>
          <strong className="text-[var(--ink)]">Uppgifter vi behandlar:</strong>
        </P>
        <List
          items={[
            "Namn som det står på dina handlingar.",
            "Uppgivet resultat och provtillfälle (HP-vägen), eller ämnen och behörighet (lärarvägen).",
            "Ditt meddelande.",
            "Intyg om att du är minst 18 år, och när du lämnade ditt samtycke.",
            "Underlag du laddar upp: officiellt resultatbesked, lärarlegitimation eller registerutdrag, och en ID-handling.",
            "Granskarens beslut, kontrolltyp, verifierat resultat eller behörighet, källa och motivering.",
          ]}
        />
        <P>
          <strong className="text-[var(--ink)]">Varför:</strong> för att kontrollera att du uppfyller kraven och
          visa ärliga märken, till exempel ”HP-resultat granskat” eller ”Legitimerad lärare”.
        </P>
        <P>
          <strong className="text-[var(--ink)]">Rättslig grund:</strong> ditt samtycke, som du lämnar när du
          skickar in ansökan. Du kan återkalla samtycket när du vill genom att dra tillbaka ansökan. Då raderas
          dina underlag direkt. Beslut som redan har fattats sparas enligt avsnitt 6, eftersom vi har ett
          berättigat intresse av att kunna visa varför ett märke gavs.
        </P>
        <P>
          <strong className="text-[var(--ink)]">Personnummer:</strong> vi sparar aldrig personnummer i
          databasen. Om din ID-handling visar personnummer kan du täcka över de fyra sista siffrorna innan du
          laddar upp den. Vi behöver bara se ditt namn, din bild och ditt födelsedatum.
        </P>
        <P>
          <strong className="text-[var(--ink)]">Vem ser underlagen:</strong> bara granskare som har fått den
          särskilda behörigheten att se känsliga dokument. Varje gång någon öppnar ett dokument loggas det.
          Länken gäller i fem minuter.
        </P>
        <P>
          <strong className="text-[var(--ink)]">Hur länge underlagen sparas:</strong> högst 90 dagar från
          uppladdningen och högst 30 dagar efter att ett beslut har fattats. Därefter raderas filerna
          automatiskt.
        </P>
        <P>
          <strong className="text-[var(--ink)]">Expertprofil:</strong> om du blir godkänd och väljer att
          publicera din profil visas den för alla, även utloggade. Profilen innehåller visningsnamn, rubrik och
          presentation, delprov, språk och ort, priser och märken, och HP-resultatet om du väljer att visa det.
          Ditt konto-id och din e-postadress visas aldrig.
        </P>
      </Section>

      <Section id="synligt" title="5. Vad är synligt för andra?">
        <List
          items={[
            "Ditt användarnamn eller visningsnamn syns i dueller, på topplistor och vid dina foruminlägg.",
            "Foruminlägg, röstsummor och rykte är synliga för alla, även för utloggade besökare.",
            "Expertprofiler syns bara när experten själv har publicerat dem.",
            "Din e-postadress visas aldrig för andra användare.",
          ]}
        />
      </Section>

      <Section id="lagringstid" title="6. Hur länge sparar vi uppgifterna?">
        <Rows
          rows={[
            {
              title: "Konto, profil, studiedata, dueller och topplistor",
              fields: [["Hur länge", "Så länge du har kontot. Raderas när du tar bort kontot."]],
            },
            {
              title: "Foruminlägg",
              fields: [
                ["Hur länge", "Tills du tar bort inlägget eller kontot. När kontot tas bort raderas texten och inlägget visas som ”Raderat konto”, så att andras svar i tråden finns kvar."],
              ],
            },
            {
              title: "Underlag i expertansökan",
              fields: [["Hur länge", "Högst 90 dagar, högst 30 dagar efter beslut, och direkt om du drar tillbaka ansökan."]],
            },
            {
              title: "Övriga uppgifter i expertansökan och granskningsbeslut",
              fields: [
                ["Hur länge", "Avslagna och tillbakadragna ansökningar: 12 månader efter beslutet. Utkast och ansökningar som väntar på komplettering: 6 månader efter senaste ändringen. Godkända och spärrade ansökningar: så länge du har kontot."],
              ],
            },
            {
              title: "Önskemål och felrapporter",
              fields: [["Hur länge", "Tills ärendet är avslutat. När du tar bort kontot kopplas rapporten bort från dig, men texten sparas."]],
            },
            {
              title: "Logg över administrativa åtgärder",
              fields: [["Hur länge", "24 månader. Loggen visar till exempel vem som har öppnat ett dokument."]],
            },
            {
              title: "Tekniska loggar hos våra leverantörer",
              fields: [["Hur länge", "Enligt leverantörens rutiner, normalt några dagar till några veckor."]],
            },
          ]}
        />
        <P>Du tar själv bort ditt konto på profilsidan under ”Ta bort konto”.</P>
      </Section>

      <Section id="leverantorer" title="7. Vilka leverantörer hanterar uppgifterna?">
        <P>
          Vi säljer aldrig dina uppgifter. Vi använder följande leverantörer, som behandlar uppgifterna för vår
          räkning (personuppgiftsbiträden):
        </P>
        <Rows
          rows={[
            {
              title: "Supabase Pte. Ltd. (Singapore, del av amerikanska Supabase Inc.)",
              fields: [
                ["Vad", "Databas, inloggning, lagring av filer, e-post vid inloggning och lösenordsåterställning"],
                ["Var", "Data lagras inom EU (Irland). Överföring utanför EU skyddas av EU-kommissionens standardavtalsklausuler, som ingår i Supabases personuppgiftsbiträdesavtal."],
              ],
            },
            {
              title: "Vercel Inc.",
              fields: [
                ["Vad", "Webbhotell, serverfunktioner och schemalagda jobb. Tar emot IP-adress och teknisk information när du besöker sidan."],
                ["Var", "USA och EU. Vercel omfattas av EU–US Data Privacy Framework och standardavtalsklausuler."],
              ],
            },
          ]}
        />
        <P>
          Om du väljer att logga in med Google får vi ditt namn, din e-postadress och eventuellt din profilbild
          från Google. Google behandlar då uppgifter enligt sin egen integritetspolicy.
        </P>
        <P>Vi kan också behöva lämna ut uppgifter till myndigheter om lagen kräver det.</P>
      </Section>

      <Section id="cookies" title="8. Cookies och lagring i webbläsaren">
        <P>
          HP Lift använder inga cookies för spårning, statistik eller reklam. Vi lagrar uppgifter i din
          webbläsare bara för att tjänsten ska fungera:
        </P>
        <List items={["din inloggning,", "dina studiedata,", "valt tema (ljust eller mörkt),", "om ljud är på."]} />
        <P>
          Den lagringen är nödvändig för funktioner du själv har bett om, och kräver därför inget samtycke. Om vi
          i framtiden visar annonser eller använder statistikverktyg frågar vi först om ditt samtycke, och då
          uppdaterar vi den här policyn.
        </P>
      </Section>

      <Section id="rattigheter" title="9. Dina rättigheter">
        <P>Du har rätt att:</P>
        <List
          items={[
            "få veta vilka uppgifter vi har om dig och få en kopia (registerutdrag),",
            "få felaktiga uppgifter rättade – profil och användarnamn ändrar du själv i appen,",
            "få dina uppgifter raderade – du tar själv bort kontot på profilsidan,",
            "få ut uppgifter du har gett oss i ett maskinläsbart format (dataportabilitet),",
            "invända mot behandling som bygger på berättigat intresse,",
            "återkalla ditt samtycke, till exempel genom att dra tillbaka en expertansökan,",
            "begära att behandlingen begränsas.",
          ]}
        />
        <P>
          Kontakta oss på <Mail /> för att använda dina rättigheter. Vi svarar inom en månad.
        </P>
        <P>
          Om du tycker att vi behandlar dina uppgifter fel kan du klaga hos Integritetsskyddsmyndigheten (IMY),{" "}
          <a href="https://www.imy.se" className="font-medium text-[var(--brand)] hover:underline" rel="noopener noreferrer" target="_blank">
            www.imy.se
          </a>
          .
        </P>
      </Section>

      <Section id="sakerhet" title="10. Säkerhet">
        <List
          items={[
            "All trafik är krypterad (HTTPS).",
            "Databasen har behörighetsregler på varje tabell, så att du bara kommer åt dina egna uppgifter.",
            "Administrativa beslut kan bara fattas av personer med en särskild roll, och de loggas.",
            "Expertunderlag ligger i en privat lagringsplats och visas bara via tillfälliga länkar.",
            "Lösenord lagras aldrig i klartext.",
          ]}
        />
      </Section>

      <Section id="andringar" title="11. Ändringar">
        <P>
          Vi uppdaterar policyn när tjänsten ändras. Datumet högst upp visar när den senast ändrades. Vid större
          ändringar meddelar vi dig i appen.
        </P>
      </Section>
    </article>
  );
}
