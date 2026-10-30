import { useState } from "react"

const API = "http://127.0.0.1:8000"

function App() {
  const [profile, setProfile] = useState({
    age: "",
    state: "Karnataka",
    occupation: "Student",
    income: "",
    category: "General",
    gender: "Female",
    disability: "No",
  })

  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [askLoading, setAskLoading] = useState(false)

  function updateProfile(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function findSchemes() {
    setLoading(true)
    setSearched(true)
    setRecommendations([])

    try {
      const response = await fetch(`${API}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: profile.age ? Number(profile.age) : null,
          state: profile.state,
          occupation: profile.occupation,
          income: profile.income ? Number(profile.income) : null,
          category: profile.category,
          gender: profile.gender,
          disability: profile.disability,
        }),
      })

      if (!response.ok) {
        throw new Error("Recommendation request failed")
      }

      const data = await response.json()

      setRecommendations(data.recommendations || [])

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 150)
    } catch (error) {
      console.error(error)
      setRecommendations([])
    }

    setLoading(false)
  }

  async function askAI() {
    if (!question.trim()) return

    setAskLoading(true)
    setAnswer("")

    try {
      const response = await fetch(`${API}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
        }),
      })

      if (!response.ok) {
        throw new Error("AI request failed")
      }

      const data = await response.json()

      setAnswer(
        data.answer ||
          "I couldn't find an answer. Please try another question."
      )
    } catch (error) {
      console.error(error)

      setAnswer(
        "Could not connect to AI Sahaay backend. Please make sure the FastAPI server is running."
      )
    }

    setAskLoading(false)
  }

  function chooseOccupation(value) {
    updateProfile("occupation", value)
  }

  const quickQuestions = [
    "What scholarships are available for students?",
    "What schemes are available for women?",
    "What employment schemes can I apply for?",
  ]

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#0F172A]">

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-[#D9E2EB]/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <div className="saffron-accent flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1F3A] to-[#1D4ED8] text-xl shadow-lg shadow-[#0B1F3A]/20">
              🇮🇳
            </div>

            <div>
              <div className="text-xl font-black tracking-tight text-[#0B1F3A]">
                AI Sahaay
              </div>

              <div className="text-xs font-medium text-[#64748B] sm:text-sm">
                Your Government Scheme Assistant
              </div>
            </div>

          </div>

          <div className="hidden items-center gap-2 sm:flex">

            <span className="rounded-full bg-[#ECFDF5] px-3 py-1.5 text-xs font-bold text-[#059669]">
              ● 3,400+ Schemes
            </span>

            <span className="rounded-full bg-[#EAF2FF] px-3 py-1.5 text-xs font-bold text-[#1D4ED8]">
              ✨ AI Powered
            </span>

          </div>

        </div>
      </header>


      {/* HERO */}

      <section className="relative overflow-hidden bg-[#F6F9FC] px-4 pb-14 pt-14 sm:px-6 sm:pt-20">

        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#0B1F3A]/10 blur-3xl" />

        <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#4F46E5]/10 blur-3xl" />

        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-[#1D4ED8]/[0.06] blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center animate-fade-up">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D9E2EB] bg-white/80 px-4 py-2 text-xs font-bold text-[#0B1F3A] shadow-sm sm:text-sm">
            🇮🇳 AI-powered Government Scheme Discovery
          </div>

          <h1 className="text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
            Government schemes,
            <br />

            <span className="bg-gradient-to-r from-[#0B1F3A] via-[#1D4ED8] to-[#4F46E5] bg-clip-text text-transparent">
              made for you.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#64748B] sm:text-lg sm:leading-8">
            Tell AI Sahaay a little about yourself. Our personalized
            matching engine finds government schemes that may be relevant
            to your age, state, occupation, income and profile.
          </p>

          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">

            <div className="rounded-full border border-[#D9E2EB] bg-white px-4 py-2 text-sm font-semibold text-[#64748B] shadow-sm">
              🎯 Personalized matching
            </div>

            <div className="rounded-full border border-[#D9E2EB] bg-white px-4 py-2 text-sm font-semibold text-[#64748B] shadow-sm">
              🔎 RAG-powered search
            </div>

            <div className="rounded-full border border-[#D9E2EB] bg-white px-4 py-2 text-sm font-semibold text-[#64748B] shadow-sm">
              🇮🇳 Government schemes
            </div>

          </div>

        </div>
      </section>


      {/* MAIN */}

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">

        {/* PROFILE */}

        <section className="rounded-3xl border border-[#D9E2EB] bg-white p-5 shadow-xl shadow-[#0B1F3A]/5 sm:p-8 lg:p-10">

          <div className="mb-8">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF2FF] text-2xl">
                👤
              </div>

              <div>

                <h2 className="text-2xl font-black tracking-tight text-[#0F172A] sm:text-3xl">
                  Tell us about yourself
                </h2>

                <p className="mt-1 text-sm text-[#64748B] sm:text-base">
                  Answer a few questions and we'll find schemes relevant to you.
                </p>

              </div>

            </div>


            <div className="mt-7">

              <div className="mb-2 flex items-center justify-between text-xs font-bold">

                <span className="text-[#1D4ED8]">
                  Your profile
                </span>

                <span className="text-slate-400">
                  Step 1 of 1
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                <div className="h-full w-full rounded-full bg-gradient-to-r from-[#0B1F3A] via-[#1D4ED8] to-[#4F46E5]" />

              </div>

            </div>

          </div>


          {/* OCCUPATION */}

          <div className="mb-8">

            <div className="mb-3 text-sm font-bold text-[#0F172A]">
              I am mainly a...
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

              <OccupationButton
                icon="🎓"
                label="Student"
                active={profile.occupation === "Student"}
                onClick={() => chooseOccupation("Student")}
              />

              <OccupationButton
                icon="👨‍🌾"
                label="Farmer"
                active={profile.occupation === "Farmer"}
                onClick={() => chooseOccupation("Farmer")}
              />

              <OccupationButton
                icon="💼"
                label="Employee"
                active={profile.occupation === "Employment"}
                onClick={() => chooseOccupation("Employment")}
              />

              <OccupationButton
                icon="🏪"
                label="Business"
                active={profile.occupation === "Business"}
                onClick={() => chooseOccupation("Business")}
              />

            </div>

          </div>


          {/* FORM */}

          <div className="grid gap-5 md:grid-cols-2">

            <Field label="Age">

              <input
                type="number"
                min="1"
                max="120"
                placeholder="e.g. 21"
                value={profile.age}
                onChange={(e) =>
                  updateProfile("age", e.target.value)
                }
                className="input"
              />

            </Field>


            <Field label="State">

              <select
                value={profile.state}
                onChange={(e) =>
                  updateProfile("state", e.target.value)
                }
                className="input"
              >

                <option>Karnataka</option>
                <option>Tamil Nadu</option>
                <option>Kerala</option>
                <option>Andhra Pradesh</option>
                <option>Telangana</option>
                <option>Maharashtra</option>
                <option>Delhi</option>
                <option>Gujarat</option>
                <option>West Bengal</option>
                <option>Rajasthan</option>
                <option>Uttar Pradesh</option>
                <option>Madhya Pradesh</option>
                <option>Odisha</option>
                <option>Punjab</option>
                <option>Haryana</option>
                <option>Bihar</option>
                <option>Jharkhand</option>
                <option>Assam</option>
                <option>Other</option>

              </select>

            </Field>


            <Field label="Occupation">

              <select
                value={profile.occupation}
                onChange={(e) =>
                  updateProfile("occupation", e.target.value)
                }
                className="input"
              >

                <option>Student</option>
                <option>Farmer</option>
                <option>Employment</option>
                <option>Self-employed</option>
                <option>Business</option>
                <option>Worker</option>
                <option>Unemployed</option>
                <option>Other</option>

              </select>

            </Field>


            <Field label="Annual Family Income">

              <div className="relative">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                  ₹
                </span>

                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={profile.income}
                  onChange={(e) =>
                    updateProfile("income", e.target.value)
                  }
                  className="input pl-9"
                />

              </div>

            </Field>


            <Field label="Social Category">

              <select
                value={profile.category}
                onChange={(e) =>
                  updateProfile("category", e.target.value)
                }
                className="input"
              >

                <option>General</option>
                <option>OBC</option>
                <option>SC</option>
                <option>ST</option>
                <option>Minority</option>

              </select>

            </Field>


            <Field label="Gender">

              <select
                value={profile.gender}
                onChange={(e) =>
                  updateProfile("gender", e.target.value)
                }
                className="input"
              >

                <option>Female</option>
                <option>Male</option>
                <option>Other</option>

              </select>

            </Field>


            <Field label="Person with Disability">

              <select
                value={profile.disability}
                onChange={(e) =>
                  updateProfile("disability", e.target.value)
                }
                className="input"
              >

                <option>No</option>
                <option>Yes</option>

              </select>

            </Field>

          </div>


          {/* FIND */}
          <div className="mb-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            
  <button
    type="button"
    onClick={() =>
      setProfile({
        age: "21",
        state: "Karnataka",
        occupation: "Student",
        income: "150000",
        category: "OBC",
        gender: "Female",
        disability: "No",
      })
    }
    className="rounded-xl border border-[#1D4ED8]/25 bg-[#EAF2FF] px-5 py-2.5 text-sm font-bold text-[#1D4ED8] transition hover:bg-[#1D4ED8]/10"
  >
    ⚡ Try Demo Profile
  </button>

  <span className="text-xs text-slate-400">
    Instantly fill a sample student profile
  </span>
</div>
        

          <button
            onClick={findSchemes}
            disabled={loading}
            className="group mt-8 w-full rounded-2xl bg-gradient-to-br from-[#0B1F3A] via-[#1D4ED8] to-[#4F46E5] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#0B1F3A]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
          >

            {loading ? (

              <span className="flex items-center justify-center gap-3">

                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                AI Sahaay is analyzing your profile...

              </span>

            ) : (

              <span className="flex items-center justify-center gap-2">

                ✨ Find My Personalized Schemes

                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>

              </span>

            )}

          </button>


          <p className="mt-3 text-center text-xs text-slate-400">
            Your information is used only to personalize your scheme search.
          </p>

        </section>


        {/* RESULTS */}

        {searched && (

          <section
            id="results"
            className="mt-12 scroll-mt-24"
          >

            <div className="mb-7">

              <div className="text-xs font-black uppercase tracking-[0.2em] text-[#1D4ED8]">
                Personalized Results
              </div>

              <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

                <div>

                  <h2 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">
                    ✨ Your Best Scheme Matches
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
                    AI Sahaay ranked schemes using your profile,
                    eligibility information and semantic matching.
                  </p>

                </div>

                {!loading && recommendations.length > 0 && (

                  <div className="w-fit rounded-full bg-[#EAF2FF] px-4 py-2 text-sm font-bold text-[#1D4ED8]">
                    {recommendations.length} match
                    {recommendations.length === 1 ? "" : "es"} found
                  </div>

                )}

              </div>

            </div>


            {/* LOADING */}

            {loading && (

              <div className="rounded-3xl border border-[#D9E2EB] bg-white p-10 text-center shadow-xl">

                <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-[#EAF2FF] text-3xl">
                  🤖
                </div>

                <div className="mt-5 text-xl font-black text-[#0F172A]">
                  AI Sahaay is finding your matches...
                </div>

                <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
                  Checking state, occupation, income, category and eligibility information.
                </div>

                <div className="mx-auto mt-6 h-2 max-w-sm overflow-hidden rounded-full bg-slate-100">

                  <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-[#0B1F3A] to-[#4F46E5]" />

                </div>

              </div>

            )}


            {/* EMPTY */}

            {!loading && recommendations.length === 0 && (

              <div className="rounded-3xl border border-[#D9E2EB] bg-white p-10 text-center shadow-xl">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                  🔍
                </div>

                <h3 className="mt-5 text-xl font-black text-[#0F172A]">
                  No strong matches found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
                  Try changing your profile details or ask AI Sahaay a question below.
                </p>

              </div>

            )}


            {/* RESULTS */}

            {!loading && recommendations.length > 0 && (

              <div className="space-y-6">

                {recommendations.map((scheme, index) => (

                  <SchemeCard
                    key={scheme.slug || scheme.scheme_name}
                    scheme={scheme}
                    index={index}
                  />

                ))}

              </div>

            )}

          </section>

        )}


        {/* ASK AI */}

        <section className="mt-16 overflow-hidden rounded-3xl border border-[#D9E2EB] bg-white shadow-xl">

          <div className="bg-gradient-to-r from-[#071426] to-[#0B1F3A] p-6 text-white sm:p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                🤖
              </div>

              <div>

                <h2 className="text-2xl font-black sm:text-3xl">
                  Ask AI Sahaay
                </h2>

                <p className="mt-1 text-sm text-[#C7D6F5] sm:text-base">
                  Ask questions about government schemes in plain language.
                </p>

              </div>

            </div>

          </div>


          <div className="p-5 sm:p-8">

            <div className="flex flex-col gap-3 md:flex-row">

              <input
                type="text"
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    askAI()
                  }
                }}
                placeholder="e.g. What scholarships are available for students?"
                className="input flex-1"
              />

              <button
                onClick={askAI}
                disabled={askLoading || !question.trim()}
                className="rounded-2xl bg-[#0B1F3A] px-7 py-3 font-bold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {askLoading ? "Thinking..." : "Ask AI →"}

              </button>

            </div>


            <div className="mt-4">

              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Try asking
              </div>

              <div className="flex flex-wrap gap-2">

                {quickQuestions.map((item) => (

                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuestion(item)}
                    className="rounded-full border border-[#1D4ED8]/15 bg-[#EAF2FF] px-3 py-2 text-xs font-semibold text-[#1D4ED8] transition hover:border-[#1D4ED8]/30 hover:bg-[#1D4ED8]/10"
                  >
                    {item}
                  </button>

                ))}

              </div>

            </div>


            {answer && (

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#1D4ED8]/15 animate-fade-in">

                <div className="flex items-center gap-2 border-b border-[#1D4ED8]/15 bg-[#EAF2FF] px-5 py-3 text-sm font-black text-[#0B1F3A]">
                  🤖 AI Sahaay

                  <span className="rounded-full bg-[#1D4ED8]/10 px-2 py-0.5 text-[10px] font-bold text-[#1D4ED8]">
                    RAG
                  </span>
                </div>

                <div className="whitespace-pre-wrap p-5 text-sm leading-7 text-[#334155] sm:text-base">
                  {answer}
                </div>

              </div>

            )}

          </div>

        </section>


        {/* FOOTER */}

        <footer className="py-12 text-center">

          <div className="mx-auto mb-5 h-px max-w-5xl bg-[#D9E2EB]" />

          <div className="font-black text-[#0B1F3A]">
            🇮🇳 AI Sahaay
          </div>

          <div className="mt-2 text-sm text-[#64748B]">
            Making government schemes easier to discover.
          </div>

          <div className="mx-auto mt-5 max-w-xl rounded-2xl bg-[#FFF7ED] px-4 py-3 text-xs leading-5 text-[#92400E]">
            ⚠️ Information is provided for guidance only. Please verify the latest eligibility requirements and application process with the official authority.
          </div>

        </footer>

      </main>

    </div>
  )
}


/* FIELD */

function Field({ label, children }) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-[#0F172A]">
        {label}
      </label>

      {children}

    </div>
  )
}


/* OCCUPATION BUTTON */

function OccupationButton({
  icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
        active
          ? "border-[#1D4ED8] bg-[#EAF2FF] shadow-md shadow-[#1D4ED8]/10 ring-2 ring-[#1D4ED8]/10"
          : "border-[#D9E2EB] bg-white hover:-translate-y-0.5 hover:border-[#1D4ED8]/40 hover:bg-[#EAF2FF]/50"
      }`}
    >

      <div className="text-2xl">
        {icon}
      </div>

      <div
        className={`mt-2 text-sm font-bold ${
          active ? "text-[#1D4ED8]" : "text-[#0F172A]"
        }`}
      >
        {label}
      </div>

      {active && (

        <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#1D4ED8]">
          Selected ✓
        </div>

      )}

    </button>
  )
}


/* SCHEME CARD */

function SchemeCard({ scheme, index }) {

  const score = scheme.match_score || 0

  const status =
    score === 100
      ? "Perfect Match"
      : scheme.match_status ||
        (score >= 80
          ? "Strong Match"
          : score >= 50
            ? "Good Match"
            : "Possible Match")

  const reasons = scheme.match_reasons || []

  const isBest = index === 0 && score >= 70

  return (

    <article
      className={`scheme-result relative overflow-hidden rounded-3xl border bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        isBest
          ? "best-match border-[#1D4ED8]/30 ring-2 ring-[#1D4ED8]/10"
          : "border-[#D9E2EB]"
      }`}
    >

      {isBest && (

        <div className="bg-gradient-to-r from-[#0B1F3A] via-[#1D4ED8] to-[#4F46E5] px-5 py-2.5 text-center text-xs font-black uppercase tracking-[0.15em] text-white">
          🏆 Best Match For You • {score}% Match
        </div>

      )}


      <div className="p-5 sm:p-7 lg:p-8">

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

          <div className="flex min-w-0 gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EAF2FF] to-[#EDE9FE] text-2xl">
              🎓
            </div>

            <div className="min-w-0">

              <div className="text-xs font-black uppercase tracking-wider text-[#1D4ED8]">
                Scheme {index + 1}
              </div>

              <h3 className="mt-1 break-words text-xl font-black leading-tight text-[#0F172A] sm:text-2xl">
                {scheme.scheme_name}
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">

                {scheme.level && (

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {scheme.level}
                  </span>

                )}

                {scheme.category && (

                  <span className="rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]">
                    {scheme.category}
                  </span>

                )}

              </div>

            </div>

          </div>


          {/* SCORE */}

          <div
            className={`score-ring w-full shrink-0 rounded-2xl px-5 py-4 text-center md:w-32 ${
              score >= 80
                ? "bg-[#ECFDF5]"
                : score >= 50
                  ? "bg-[#EAF2FF]"
                  : "bg-slate-100"
            }`}
          >

            <div
              className={`text-3xl font-black ${
                score >= 80
                  ? "text-[#059669]"
                  : score >= 50
                    ? "text-[#1D4ED8]"
                    : "text-slate-600"
              }`}
            >
              {score}%
            </div>

            <div
              className={`text-xs font-bold ${
                score >= 80
                  ? "text-[#059669]"
                  : score >= 50
                    ? "text-[#1D4ED8]"
                    : "text-slate-600"
              }`}
            >
              {status}
            </div>

          </div>

        </div>


        {/* MATCH BAR */}

        <div className="mt-6">

          <div className="mb-2 flex justify-between text-[11px] font-bold text-slate-400">
            <span>Profile match</span>
            <span>{score}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-700"
              style={{
                width: `${Math.min(score, 100)}%`,
              }}
            />

          </div>

        </div>


        {/* DETAILS */}

        {scheme.details && (

          <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base">
            {scheme.details.slice(0, 500)}

            {scheme.details.length > 500 ? "..." : ""}
          </p>

        )}


        {/* BENEFITS */}

        {scheme.benefits && (

          <div className="mt-6 rounded-2xl border border-[#059669]/15 bg-gradient-to-br from-[#ECFDF5] to-[#F0FDF4] p-5">

            <div className="font-black text-[#065F46]">
              💰 Benefits
            </div>

            <p className="mt-2 text-sm leading-7 text-[#064E3B] sm:text-base">
              {scheme.benefits.slice(0, 500)}

              {scheme.benefits.length > 500 ? "..." : ""}
            </p>

          </div>

        )}


        {/* WHY MATCH */}

        {reasons.length > 0 && (

          <div className="mt-6">

            <div className="font-black text-[#0F172A]">
              🎯 Why this matches you
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">

              {reasons.slice(0, 4).map((reason, i) => (

                <div
                  key={i}
                  className="rounded-xl border border-[#1D4ED8]/15 bg-[#EAF2FF] px-4 py-3 text-sm font-medium leading-6 text-[#0B1F3A]"
                >
                  <span className="mr-1 font-black text-[#1D4ED8]">
                    ✓
                  </span>

                  {reason}
                </div>

              ))}

            </div>

          </div>

        )}


        {/* ELIGIBILITY */}

        {scheme.eligibility && (

          <details className="group mt-6 overflow-hidden rounded-2xl border border-[#D9E2EB] bg-slate-50">

            <summary className="cursor-pointer list-none px-5 py-4 font-black text-slate-800">

              <span className="flex items-center justify-between">

                👤 Eligibility

                <span className="text-slate-400 transition group-open:rotate-180">
                  ▼
                </span>

              </span>

            </summary>

            <p className="border-t border-[#D9E2EB] px-5 pb-5 pt-4 text-sm leading-7 text-slate-600">
              {scheme.eligibility}
            </p>

          </details>

        )}


        {/* DOCUMENTS */}

        {scheme.documents && (

          <details className="group mt-3 overflow-hidden rounded-2xl border border-[#D9E2EB] bg-slate-50">

            <summary className="cursor-pointer list-none px-5 py-4 font-black text-slate-800">

              <span className="flex items-center justify-between">

                📄 Documents Required

                <span className="text-slate-400 transition group-open:rotate-180">
                  ▼
                </span>

              </span>

            </summary>

            <p className="border-t border-[#D9E2EB] px-5 pb-5 pt-4 text-sm leading-7 text-slate-600">
              {scheme.documents}
            </p>

          </details>

        )}


        {/* APPLICATION */}

        {scheme.application && (

          <details className="group mt-3 overflow-hidden rounded-2xl border border-[#D9E2EB] bg-slate-50">

            <summary className="cursor-pointer list-none px-5 py-4 font-black text-slate-800">

              <span className="flex items-center justify-between">

                📝 How to Apply

                <span className="text-slate-400 transition group-open:rotate-180">
                  ▼
                </span>

              </span>

            </summary>

            <p className="whitespace-pre-wrap border-t border-[#D9E2EB] px-5 pb-5 pt-4 text-sm leading-7 text-slate-600">
              {scheme.application}
            </p>

          </details>

        )}


        {/* OFFICIAL LINK */}

        <div className="mt-6">

          {scheme.official_urls &&
          scheme.official_urls.length > 0 ? (

            <a
              href={scheme.official_urls[0]}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl bg-[#0B1F3A] px-6 py-3.5 text-center text-sm font-black text-white transition hover:bg-[#1D4ED8] sm:text-base"
            >
              🔗 View Official Information
              <span className="ml-2">
                →
              </span>
            </a>

          ) : (

            <div className="rounded-2xl bg-slate-100 px-6 py-3.5 text-center text-xs font-bold text-slate-500 sm:text-sm">
              ℹ️ Verify the official application portal before applying
            </div>

          )}

        </div>

      </div>

    </article>
  )
}


export default App