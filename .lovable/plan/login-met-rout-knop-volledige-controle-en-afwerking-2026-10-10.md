# "Login met ROUT"-knop: volledige controle en afwerking

Doel: een andere app die de ROUT-knop toevoegt (volgens de brief) werkt in één keer, ziet er officieel uit en krijgt duidelijke foutmeldingen.

## Wat al aanwezig is (gecontroleerd)
- Discovery-adres met ES256, PKCE (S256), scopes `openid profile email linked_accounts`, open CORS.
- Token- en userinfo-adres met nette foutcodes, rate limit, PKCE- en redirect-URI-controle.
- Toestemmingsscherm (`/oauth/authorize`) met nonce en Rich Identity.
- Ontwikkelaarspagina met voorbeeldcode en SQL-schema.

## Wat ik ga controleren en verbeteren
1. **Volledige test van de stroom**: een testscript doorloopt discovery → authorize → token → id_token (handtekening via JWKS, iss/aud/exp/nonce) → userinfo. Elke stap een eigen test.
2. **Popup-flow**: het toestemmingsscherm netjes op 500×650 laten werken (geen afgesneden knoppen, juiste terugkeer naar de app, `window.opener` veilig afhandelen); terugval op gewone redirect.
3. **Foutcodes terug naar de app**: weigeren, ongeldige client, verkeerde redirect-URI, verlopen sessie geven altijd `?error=...&state=...` terug volgens de standaard, nooit een kale ROUT-foutpagina waar dat niet hoort.
4. **Officiële knoppenkit**: een `/brand/button`-pagina met de knop in NL/EN/FR/DE, licht/donker, met het konijnlogo, kopieerbare code (HTML + React) en klikgrootte ≥44px.
5. **Ontwikkelaarspagina**: voorbeeldcode in lijn met de brief (popup + redirect, HttpOnly-cookies, account koppelen op geverifieerd e-mailadres), plus een tabel met foutcodes en vriendelijke teksten in 4 talen.
6. **Rich Identity**: verificatievlaggen alleen uit serverdata, alleen met toestemming; test dat ze niet mee komen zonder toestemming.

## Beperking
De echte stroom met een ingelogde gebruiker kan ik pas volledig testen als de Neon-database verbonden is. Zonder database test ik alle onderdelen los.

## Technisch
- Tests naast `src/lib/oauth/*.test.ts`; id_token-check met `jose`.
- Foutredirects in `oauth.authorize.tsx` + `provider.server.ts` (fouten ná geldige redirect-URI → redirect, ervoor → eigen pagina, volgens RFC 6749).
- Knop-SVG uit `src/lib/brand/logo.ts` (één bron).
