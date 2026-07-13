extends Node
## Static configuration. The anon key is Supabase's *publishable* key — it
## already ships inside the web app bundle, so committing it is safe by
## design. Session tokens are NEVER stored here (see Sb.gd -> user://).

const SUPABASE_URL := "https://nvqbbbcvyhqwqfutpnje.supabase.co"
const SUPABASE_ANON_KEY := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cWJiYmN2eWhxd3FmdXRwbmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzU1NjUsImV4cCI6MjA5NjQxMTU2NX0.w10zjNgxKtsmroFgYuDqUknNmhNZFsh6Iq21KDmAXko"

## Where monster art (WebP) is served from. Point this at the deployed web
## app origin; art_url values from the DB are absolute paths like
## "/monsters/ash_knight.webp". Empty string disables art streaming and the
## game falls back to element-tinted cards.
const ART_BASE_URL := ""

const GAME_VERSION := "0.1.0-mvp"

## Element -> display color (mirrors the web app's element palette).
const ELEMENT_COLORS := {
	"fire": Color("e85d3a"),
	"water": Color("38b8f5"),
	"nature": Color("3ed97a"),
	"light": Color("e8b830"),
	"dark": Color("9b6dff"),
	"arcane": Color("d4a030"),
	"chaos": Color("e85d3a"),
	"void": Color("9b6dff"),
	"death": Color("c44f6f"),
	"dread": Color("6dc4c4"),
	"divine": Color("e8b830"),
	"digital": Color("38b8f5"),
	"stellar": Color("6db8e8"),
	"primal": Color("d4843a"),
}


static func element_color(element: String) -> Color:
	return ELEMENT_COLORS.get(element.to_lower(), Color("c9a84c"))
