export type Locale = "en" | "id";

export type LocalizedText = Record<Locale, string>;

export type CategorySlug =
  | "developer-tools"
  | "version-control"
  | "browser-automation"
  | "databases-data-platforms"
  | "cloud-devops"
  | "testing-qa"
  | "observability-monitoring"
  | "security-identity-cryptography";

export type RiskLevel = "Low" | "Moderate" | "High";
export type VerificationState = "Seed" | "Imported" | "Verified" | "Needs review";

export interface CatalogServer {
  slug: string;
  name: string;
  summary: LocalizedText;
  description: LocalizedText;
  categories: CategorySlug[];
  tags: string[];
  publisher: string;
  officialStatus: "Official" | "Claimed" | "Community";
  verification: VerificationState;
  lifecycle: "Active" | "Needs review" | "Deprecated";
  execution: "Local" | "Cloud" | "Hybrid";
  transports: ("stdio" | "Streamable HTTP" | "SSE")[];
  implementation: string;
  license: string;
  auth: LocalizedText;
  credentialVariables: string[];
  risk: RiskLevel;
  permissionTags: LocalizedText[];
  compatibility: string[];
  repositoryUrl: string;
  documentationUrl: string;
  sourceName: string;
  sourceUrl: string;
  observedAt: string;
  setup: {
    packageName: string;
    command: string;
    args: string[];
  };
  useCases: LocalizedText[];
  alternatives: string[];
}

export const categories: Array<{ slug: CategorySlug; label: LocalizedText; description: LocalizedText; icon: string }> = [
  {
    slug: "developer-tools",
    label: { en: "Developer Tools", id: "Alat Pengembang" },
    description: { en: "Build, inspect, debug, and automate software work.", id: "Bangun, inspeksi, debug, dan otomatisasi pekerjaan perangkat lunak." },
    icon: "⌘"
  },
  {
    slug: "version-control",
    label: { en: "Version Control", id: "Kontrol Versi" },
    description: { en: "Repositories, pull requests, issues, and release workflows.", id: "Repositori, pull request, issue, dan alur rilis." },
    icon: "⑂"
  },
  {
    slug: "browser-automation",
    label: { en: "Browser Automation", id: "Otomasi Browser" },
    description: { en: "Browser-driven testing, inspection, and web workflows.", id: "Pengujian, inspeksi, dan workflow web berbasis browser." },
    icon: "◉"
  },
  {
    slug: "databases-data-platforms",
    label: { en: "Databases & Data", id: "Database & Data" },
    description: { en: "Query, analyze, and administer structured data with guardrails.", id: "Query, analisis, dan administrasi data terstruktur dengan guardrail." },
    icon: "▦"
  },
  {
    slug: "cloud-devops",
    label: { en: "Cloud & DevOps", id: "Cloud & DevOps" },
    description: { en: "Infrastructure, containers, deployments, and operations.", id: "Infrastruktur, container, deployment, dan operasi." },
    icon: "☁"
  },
  {
    slug: "testing-qa",
    label: { en: "Testing & QA", id: "Testing & QA" },
    description: { en: "Test runs, quality signals, and failure investigation.", id: "Eksekusi test, sinyal kualitas, dan investigasi kegagalan." },
    icon: "✓"
  },
  {
    slug: "observability-monitoring",
    label: { en: "Observability", id: "Observabilitas" },
    description: { en: "Errors, traces, alerts, and operational investigation.", id: "Error, trace, alert, dan investigasi operasional." },
    icon: "◌"
  },
  {
    slug: "security-identity-cryptography",
    label: { en: "Security & Identity", id: "Keamanan & Identitas" },
    description: { en: "Security checks, identities, permissions, and secrets hygiene.", id: "Pemeriksaan keamanan, identitas, izin, dan kebersihan secret." },
    icon: "◇"
  }
];

export const catalogServers: CatalogServer[] = [
  {
    slug: "github-mcp-server",
    name: "GitHub MCP Server",
    summary: {
      en: "Repository, issue, pull-request, and code-search workflows for GitHub.",
      id: "Workflow repositori, issue, pull request, dan pencarian kode untuk GitHub."
    },
    description: {
      en: "A seed catalog profile for evaluating GitHub-connected developer workflows. Confirm the current official package, transport, requested scopes, and write permissions against provider documentation before installation.",
      id: "Profil seed untuk mengevaluasi workflow developer yang terhubung ke GitHub. Konfirmasikan paket resmi, transport, scope, dan izin tulis terkini pada dokumentasi provider sebelum instalasi."
    },
    categories: ["developer-tools", "version-control"],
    tags: ["github", "pull requests", "issues", "code search"],
    publisher: "GitHub",
    officialStatus: "Official",
    verification: "Seed",
    lifecycle: "Needs review",
    execution: "Hybrid",
    transports: ["stdio", "Streamable HTTP"],
    implementation: "TypeScript",
    license: "Verify with provider",
    auth: { en: "OAuth or scoped personal access token", id: "OAuth atau personal access token dengan scope terbatas" },
    credentialVariables: ["GITHUB_TOKEN"],
    risk: "High",
    permissionTags: [
      { en: "Can read repository data", id: "Dapat membaca data repositori" },
      { en: "May create or modify issues, PRs, and files when granted write scopes", id: "Dapat membuat atau mengubah issue, PR, dan file bila diberi scope tulis" }
    ],
    compatibility: ["Claude Desktop", "Cursor", "VS Code clients", "macOS", "Windows", "Linux"],
    repositoryUrl: "https://github.com/github/github-mcp-server",
    documentationUrl: "https://github.com/github/github-mcp-server",
    sourceName: "Provider repository (seed reference)",
    sourceUrl: "https://github.com/github/github-mcp-server",
    observedAt: "Not synced yet",
    setup: { packageName: "@github/github-mcp-server", command: "npx", args: ["-y", "@github/github-mcp-server"] },
    useCases: [
      { en: "Review pull requests with repository context", id: "Meninjau pull request dengan konteks repositori" },
      { en: "Search code and triage issues", id: "Mencari kode dan melakukan triage issue" }
    ],
    alternatives: ["sentry-mcp", "filesystem-mcp"]
  },
  {
    slug: "playwright-mcp",
    name: "Playwright MCP",
    summary: {
      en: "Browser automation for inspection, end-to-end workflows, and reproducible test evidence.",
      id: "Otomasi browser untuk inspeksi, workflow end-to-end, dan bukti test yang dapat direproduksi."
    },
    description: {
      en: "A local browser-control profile for developers evaluating page interaction, UI inspection, and test automation. Treat browser control as an active permission, especially around authenticated sessions.",
      id: "Profil kontrol browser lokal untuk developer yang mengevaluasi interaksi halaman, inspeksi UI, dan otomasi test. Perlakukan kontrol browser sebagai izin aktif, terutama pada sesi yang sudah login."
    },
    categories: ["developer-tools", "browser-automation", "testing-qa"],
    tags: ["browser", "e2e", "testing", "accessibility"],
    publisher: "Microsoft Playwright ecosystem",
    officialStatus: "Official",
    verification: "Seed",
    lifecycle: "Needs review",
    execution: "Local",
    transports: ["stdio"],
    implementation: "TypeScript",
    license: "Verify with provider",
    auth: { en: "No provider key by default; browser sessions may carry their own credentials", id: "Tidak memerlukan key provider secara default; sesi browser dapat membawa kredensial sendiri" },
    credentialVariables: [],
    risk: "High",
    permissionTags: [
      { en: "Browser control", id: "Kontrol browser" },
      { en: "Network egress through visited pages", id: "Akses jaringan melalui halaman yang dikunjungi" },
      { en: "May access authenticated browser content", id: "Dapat mengakses konten browser yang terautentikasi" }
    ],
    compatibility: ["Claude Desktop", "Cursor", "VS Code clients", "macOS", "Windows", "Linux"],
    repositoryUrl: "https://github.com/microsoft/playwright-mcp",
    documentationUrl: "https://github.com/microsoft/playwright-mcp",
    sourceName: "Provider repository (seed reference)",
    sourceUrl: "https://github.com/microsoft/playwright-mcp",
    observedAt: "Not synced yet",
    setup: { packageName: "@playwright/mcp", command: "npx", args: ["-y", "@playwright/mcp"] },
    useCases: [
      { en: "Investigate UI regressions with browser evidence", id: "Menyelidiki regresi UI dengan bukti dari browser" },
      { en: "Automate repeatable browser checks", id: "Mengotomatisasi pemeriksaan browser yang berulang" }
    ],
    alternatives: ["github-mcp-server", "filesystem-mcp"]
  },
  {
    slug: "postgres-mcp",
    name: "PostgreSQL MCP",
    summary: {
      en: "Database exploration and query assistance with explicit connection and permission review.",
      id: "Eksplorasi database dan bantuan query dengan peninjauan koneksi serta izin secara eksplisit."
    },
    description: {
      en: "A catalog profile for database-oriented MCP servers. Production connections should use a read-only role, a constrained network path, and query safeguards before any agent access is allowed.",
      id: "Profil katalog untuk server MCP berorientasi database. Koneksi production harus menggunakan role read-only, jalur jaringan terbatas, dan guardrail query sebelum akses agen diizinkan."
    },
    categories: ["developer-tools", "databases-data-platforms"],
    tags: ["postgres", "sql", "database", "schema"],
    publisher: "Community / provider verification pending",
    officialStatus: "Community",
    verification: "Seed",
    lifecycle: "Needs review",
    execution: "Local",
    transports: ["stdio"],
    implementation: "Multiple implementations",
    license: "Verify implementation",
    auth: { en: "Database URL or local credential", id: "Database URL atau kredensial lokal" },
    credentialVariables: ["DATABASE_URL"],
    risk: "High",
    permissionTags: [
      { en: "Sensitive data access", id: "Akses data sensitif" },
      { en: "Potential write or destructive SQL if role permits it", id: "Potensi SQL tulis atau destruktif bila role mengizinkannya" }
    ],
    compatibility: ["Claude Desktop", "Cursor", "VS Code clients", "macOS", "Windows", "Linux"],
    repositoryUrl: "https://github.com/modelcontextprotocol/servers",
    documentationUrl: "https://github.com/modelcontextprotocol/servers",
    sourceName: "Reference collection (seed reference)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    observedAt: "Not synced yet",
    setup: { packageName: "REVIEW_IMPLEMENTATION_PACKAGE", command: "npx", args: ["-y", "REVIEW_IMPLEMENTATION_PACKAGE"] },
    useCases: [
      { en: "Explore schemas using a read-only database role", id: "Menjelajahi skema menggunakan role database read-only" },
      { en: "Diagnose query and migration issues", id: "Mendiagnosis masalah query dan migrasi" }
    ],
    alternatives: ["filesystem-mcp", "sentry-mcp"]
  },
  {
    slug: "sentry-mcp",
    name: "Sentry MCP",
    summary: {
      en: "Investigate application errors, events, releases, and operational context.",
      id: "Menyelidiki error aplikasi, event, rilis, dan konteks operasional."
    },
    description: {
      en: "A monitoring-focused profile for connecting agent workflows to error investigation. Verify organization scopes and data retention implications before connection.",
      id: "Profil berfokus monitoring untuk menghubungkan workflow agen ke investigasi error. Verifikasikan scope organisasi dan implikasi retensi data sebelum koneksi."
    },
    categories: ["developer-tools", "observability-monitoring"],
    tags: ["errors", "traces", "releases", "monitoring"],
    publisher: "Sentry",
    officialStatus: "Official",
    verification: "Seed",
    lifecycle: "Needs review",
    execution: "Cloud",
    transports: ["Streamable HTTP"],
    implementation: "Provider hosted",
    license: "Provider terms",
    auth: { en: "OAuth or scoped provider token", id: "OAuth atau token provider dengan scope terbatas" },
    credentialVariables: ["SENTRY_AUTH_TOKEN"],
    risk: "Moderate",
    permissionTags: [
      { en: "Reads operational and error data", id: "Membaca data operasional dan error" },
      { en: "May expose identifiers in telemetry", id: "Dapat mengekspos identifier dalam telemetry" }
    ],
    compatibility: ["Remote MCP clients", "Claude Desktop", "Cursor", "VS Code clients"],
    repositoryUrl: "https://github.com/getsentry/sentry-mcp",
    documentationUrl: "https://github.com/getsentry/sentry-mcp",
    sourceName: "Provider repository (seed reference)",
    sourceUrl: "https://github.com/getsentry/sentry-mcp",
    observedAt: "Not synced yet",
    setup: { packageName: "REVIEW_PROVIDER_ENDPOINT", command: "npx", args: ["-y", "REVIEW_PROVIDER_ENDPOINT"] },
    useCases: [
      { en: "Trace a production error to relevant release context", id: "Melacak error produksi ke konteks rilis yang relevan" },
      { en: "Summarize repeated crash patterns", id: "Meringkas pola crash berulang" }
    ],
    alternatives: ["github-mcp-server", "postgres-mcp"]
  },
  {
    slug: "filesystem-mcp",
    name: "Filesystem MCP",
    summary: {
      en: "Controlled local-file inspection and manipulation within explicit allowed roots.",
      id: "Inspeksi dan manipulasi file lokal terkendali dalam root yang diizinkan secara eksplisit."
    },
    description: {
      en: "A local access profile for filesystem-oriented MCP servers. Restrict roots to a project directory, never a home directory or secrets directory, and review whether writes are enabled.",
      id: "Profil akses lokal untuk server MCP berorientasi filesystem. Batasi root ke direktori proyek, bukan home directory atau direktori secret, serta tinjau apakah izin tulis aktif."
    },
    categories: ["developer-tools", "security-identity-cryptography"],
    tags: ["files", "repository", "local", "inspection"],
    publisher: "Reference / community implementations",
    officialStatus: "Community",
    verification: "Seed",
    lifecycle: "Needs review",
    execution: "Local",
    transports: ["stdio"],
    implementation: "Multiple implementations",
    license: "Verify implementation",
    auth: { en: "No API key; access is controlled by allowed directories", id: "Tidak ada API key; akses dikendalikan oleh direktori yang diizinkan" },
    credentialVariables: [],
    risk: "High",
    permissionTags: [
      { en: "Filesystem access", id: "Akses filesystem" },
      { en: "May read or write files within configured roots", id: "Dapat membaca atau menulis file dalam root yang dikonfigurasi" }
    ],
    compatibility: ["Claude Desktop", "Cursor", "VS Code clients", "macOS", "Windows", "Linux"],
    repositoryUrl: "https://github.com/modelcontextprotocol/servers",
    documentationUrl: "https://github.com/modelcontextprotocol/servers",
    sourceName: "Reference collection (seed reference)",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    observedAt: "Not synced yet",
    setup: { packageName: "REVIEW_IMPLEMENTATION_PACKAGE", command: "npx", args: ["-y", "REVIEW_IMPLEMENTATION_PACKAGE", "/path/to/allowed/project"] },
    useCases: [
      { en: "Read an allowed project tree for code assistance", id: "Membaca struktur proyek yang diizinkan untuk bantuan coding" },
      { en: "Apply reviewed edits inside one project root", id: "Menerapkan edit yang telah ditinjau dalam satu root proyek" }
    ],
    alternatives: ["github-mcp-server", "playwright-mcp"]
  },
  {
    slug: "docker-mcp-toolkit",
    name: "Docker MCP Toolkit",
    summary: {
      en: "Container, image, and local development environment workflows for Docker-based stacks.",
      id: "Workflow container, image, dan lingkungan development lokal untuk stack berbasis Docker."
    },
    description: {
      en: "A DevOps seed profile for Docker-connected MCP capabilities. Docker socket access is highly privileged and needs explicit user review before connection.",
      id: "Profil seed DevOps untuk kapabilitas MCP yang terhubung Docker. Akses socket Docker sangat berprivilege dan perlu peninjauan pengguna secara eksplisit sebelum koneksi."
    },
    categories: ["developer-tools", "cloud-devops"],
    tags: ["docker", "containers", "images", "devops"],
    publisher: "Docker ecosystem",
    officialStatus: "Claimed",
    verification: "Seed",
    lifecycle: "Needs review",
    execution: "Local",
    transports: ["stdio"],
    implementation: "Verify implementation",
    license: "Verify implementation",
    auth: { en: "Local Docker context and optional provider authentication", id: "Konteks Docker lokal dan autentikasi provider opsional" },
    credentialVariables: [],
    risk: "High",
    permissionTags: [
      { en: "Shell/code execution through container workflows", id: "Eksekusi shell/kode melalui workflow container" },
      { en: "May control local Docker daemon", id: "Dapat mengontrol Docker daemon lokal" }
    ],
    compatibility: ["Claude Desktop", "Cursor", "VS Code clients", "macOS", "Windows", "Linux"],
    repositoryUrl: "https://github.com/docker/mcp-gateway",
    documentationUrl: "https://github.com/docker/mcp-gateway",
    sourceName: "Provider repository (seed reference)",
    sourceUrl: "https://github.com/docker/mcp-gateway",
    observedAt: "Not synced yet",
    setup: { packageName: "REVIEW_DOCKER_MCP_PACKAGE", command: "npx", args: ["-y", "REVIEW_DOCKER_MCP_PACKAGE"] },
    useCases: [
      { en: "Inspect local development containers", id: "Menginspeksi container development lokal" },
      { en: "Explain a container build or runtime failure", id: "Menjelaskan kegagalan build atau runtime container" }
    ],
    alternatives: ["sentry-mcp", "filesystem-mcp"]
  }
];

export function localized(value: LocalizedText, locale: Locale): string {
  return value[locale];
}

export function findServer(slug: string): CatalogServer | undefined {
  return catalogServers.find((server) => server.slug === slug);
}

export function findServers(slugs: string[]): CatalogServer[] {
  return slugs.map(findServer).filter((server): server is CatalogServer => Boolean(server));
}

export function categoryBySlug(slug: CategorySlug) {
  return categories.find((category) => category.slug === slug);
}

export function formatDateLabel(date: string, locale: Locale): string {
  if (date === "Not synced yet") return locale === "en" ? "Not synced yet" : "Belum disinkronkan";
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { dateStyle: "medium" }).format(new Date(date));
}
