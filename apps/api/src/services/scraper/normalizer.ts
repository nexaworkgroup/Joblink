export interface RawJob {
  external_id:     string
  title:           string
  company_name:    string
  location:        string | null
  is_remote:       boolean
  job_type:        string
  experience_level:string
  description:     string | null
  requirements:    string | null
  tags:            string[]
  salary_min:      number | null
  salary_max:      number | null
  salary_currency: string
  external_url:    string
  source:          string
  source_name:     string
  africa_hiring_signal: number
  posted_at:       string
}

export function inferJobType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('part') || t.includes('part-time'))    return 'part_time'
  if (t.includes('intern'))                              return 'internship'
  if (t.includes('contract') || t.includes('freelance'))return 'contract'
  return 'full_time'
}

export function inferLevel(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('senior') || t.includes('lead') || t.includes('principal')) return 'senior'
  if (t.includes('junior') || t.includes('entry') || t.includes('graduate'))  return 'junior'
  if (t.includes('mid') || t.includes('intermediate'))                         return 'mid'
  return 'any'
}

export function inferRemote(text: string): boolean {
  const t = text.toLowerCase()
  return t.includes('remote') || t.includes('worldwide') || t.includes('work from home') || t.includes('distributed')
}

export function normaliseDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString()
  try { return new Date(raw).toISOString() } catch { return new Date().toISOString() }
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function inferAfricaSignal(company: string, description: string, source: string): number {
  const TIER1 = ['andela','flutterwave','paystack','wave','chipper','turing','remote.com','deel']
  const TIER2 = ['africa','cameroon','nigeria','kenya','ghana','rwanda','uganda']
  const desc = (company + ' ' + description).toLowerCase()

  if (TIER1.some(k => desc.includes(k))) return 5
  if (TIER2.some(k => desc.includes(k))) return 4
  if (source === 'tier1') return 5
  if (source === 'tier2') return 4
  if (desc.includes('worldwide') || desc.includes('anywhere')) return 3
  return 3
}
