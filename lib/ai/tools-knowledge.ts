export interface ToolKnowledgeItem {
  id: string
  name: string
  slug: string
  href: string
  categoryId: 'database' | 'developer' | 'calculators' | 'files'
  categoryNameEn: string
  categoryNameAr: string
  descriptionEn: string
  descriptionAr: string
  capabilitiesEn: string[]
  capabilitiesAr: string[]
  howToUseEn: string[]
  howToUseAr: string[]
  keywords: string[]
  relatedTools: string[] // tool slugs
  supportsCodeAnalysis?: boolean
  codeType?: 'sql' | 'json' | 'regex' | 'jwt' | 'base64' | 'csv'
}

export const DIGITALMIX_TOOLS_KNOWLEDGE: ToolKnowledgeItem[] = [
  {
    id: 'sql-formatter',
    name: 'SQL Formatter',
    slug: 'sql-formatter',
    href: '/tools/sql-formatter',
    categoryId: 'database',
    categoryNameEn: 'Database Tools',
    categoryNameAr: 'أدوات قواعد البيانات',
    descriptionEn: 'Format, beautify, validate, and minify SQL queries instantly with dialect support.',
    descriptionAr: 'تنسيق وتجميل والتحقق من صحة وضغط استعلامات SQL فورياً مع دعم مختلف اللهجات.',
    capabilitiesEn: [
      'Format & beautify complex SQL queries with custom indentation',
      'Validate SQL syntax and highlight keywords',
      'Minify SQL queries by removing unnecessary whitespace and comments',
      'Support for multiple dialects: Standard SQL, PostgreSQL, MySQL, SQLite, and PL/SQL',
      'Analyze query metrics: lines, characters, SELECT, JOIN, and WHERE counts',
      'Export and copy formatted SQL queries',
    ],
    capabilitiesAr: [
      'تنسيق وتجميل استعلامات SQL المعقدة بمسافات بادئة مخصصة',
      'التحقق من صحة بناء جمل SQL وتمييز الكلمات المفتاحية',
      'ضغط وتصغير حجم استعلامات SQL بحذف الفراغات والتعليقات الزائدة',
      'دعم عدة لهجات: Standard SQL و PostgreSQL و MySQL و SQLite و PL/SQL',
      'إحصائيات فورية: عدد الأسطر، الكلمات، جمل SELECT و JOIN و WHERE',
      'تصدير ونسخ نصوص SQL المنسقة',
    ],
    howToUseEn: [
      'Paste your SQL query into the editor or upload a .sql file.',
      'Select your preferred SQL dialect (e.g. PostgreSQL, MySQL, SQLite, Standard SQL).',
      'Choose formatting options such as indentation size (2 or 4 spaces) or keyword case.',
      'Click "Format SQL" or "Minify SQL" to produce the formatted output.',
      'Copy the formatted SQL or download it as a .sql file.',
    ],
    howToUseAr: [
      'الصق استعلام SQL في المحرر أو ارفع ملف .sql.',
      'اختر لهجة SQL المناسبة (مثل PostgreSQL أو MySQL أو SQLite أو Standard SQL).',
      'حدد خيارات التنسيق مثل حجم المسافات البادئة أو حالة الأحرف للكلمات المفتاحية.',
      'اضغط على "تنسيق SQL" أو "ضغط SQL" لإنشاء النتيجة.',
      'انسخ النص المنسق أو قم بتنزيله كملف .sql.',
    ],
    keywords: ['sql', 'query', 'format', 'beautify', 'minify', 'postgres', 'mysql', 'sqlite', 'plsql', 'database', 'syntax', 'where', 'join', 'select', 'table'],
    relatedTools: ['sql-validator', 'json-formatter', 'csv-json'],
    supportsCodeAnalysis: true,
    codeType: 'sql',
  },
  {
    id: 'sql-validator',
    name: 'SQL Validator',
    slug: 'sql-validator',
    href: '/tools/sql-validator',
    categoryId: 'database',
    categoryNameEn: 'Database Tools',
    categoryNameAr: 'أدوات قواعد البيانات',
    descriptionEn: 'Validate SQL query syntax, detect syntax errors, verify clause structures, and lint queries in real time.',
    descriptionAr: 'تدقيق وفحص صحة استعلامات SQL واكتشاف الأخطاء النحوية والأقواس المفقودة والجمل غير المكتملة فورياً.',
    capabilitiesEn: [
      'Validate SQL query syntax across PostgreSQL, MySQL, SQLite, and Standard SQL dialects',
      'Detect unclosed parenthesis, missing quotes, and keyword order errors',
      'Provide actionable repair suggestions and error line coordinates',
      'Analyze query clause structure (SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY)',
      '100% Client-side local syntax auditing without database connection',
    ],
    capabilitiesAr: [
      'تدقيق وبناء جمل SQL لمختلف لهجات قواعد البيانات (PostgreSQL, MySQL, SQLite)',
      'اكتشاف الأقواس المفقودة وعلامات التنصيص والأخطاء في الكلمات المفتاحية',
      'تقديم نصائح إصلاح فورية وتحديد السطر والعمود بدقة',
      'تحليل هيكل بنية الاستعلام (SELECT, FROM, WHERE, GROUP BY, ORDER BY)',
      'تدقيق نحوي محلي 100% دون الاتصال بقواعد البيانات الخارجي',
    ],
    howToUseEn: [
      'Paste your SQL query into the validator editor.',
      'Select your SQL dialect (PostgreSQL, MySQL, SQLite, etc.).',
      'Click "Validate SQL Query" to inspect syntax errors.',
      'Review error line coordinates and repair suggestions.',
    ],
    howToUseAr: [
      'الصق استعلام SQL في محرر التدقيق.',
      'اختر لهجة وقاعدة البيانات المخصصة (PostgreSQL, MySQL, SQLite).',
      'اضغط "فحص وتدقيق الاستعلام" لاكتشاف الأخطاء.',
      'راجع موقع السطر والعمود واقتراحات التصحيح.',
    ],
    keywords: ['sql', 'validator', 'syntax', 'check', 'lint', 'errors', 'query', 'database'],
    relatedTools: ['sql-formatter', 'json-validator', 'csv-json'],
    supportsCodeAnalysis: true,
    codeType: 'sql',
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    slug: 'json-formatter',
    href: '/tools/json-formatter',
    categoryId: 'database',
    categoryNameEn: 'Database Tools',
    categoryNameAr: 'أدوات قواعد البيانات',
    descriptionEn: 'Format, beautify, structure, and minify JSON data with custom indentation and tree view.',
    descriptionAr: 'تنسيق وتجميل وعرض الهيكل الشجري وضغط بيانات JSON فورياً مع التحكم في المسافات البادئة.',
    capabilitiesEn: [
      'Format & beautify raw or minified JSON strings with 2-space, 4-space, or tab indentation',
      'Minify / compact JSON payloads for efficient network transmission',
      'Visual collapsible tree inspector for deep nested objects',
      'Calculate key counts, total lines, characters, and JSON payload size',
      'Copy or download formatted JSON file directly',
    ],
    capabilitiesAr: [
      'تنسيق وتجميل نصوص JSON بمسافات بادئة 2 أو 4 أو Tab',
      'ضغط وتصغير حجم ملفات JSON لتقليل استهلاك البيانات والشبكة',
      'مستعرض شجري مرئي ومستوى العمق للعناصر المتداخلة',
      'حساب عدد المفاتيح، إجمالي الأسطر، الحجم بالكيلوبايت',
      'نسخ أو تحميل ملف JSON المنسق مباشرة',
    ],
    howToUseEn: [
      'Paste your raw JSON into the input area or load a JSON file.',
      'Select indent spacing (2 spaces, 4 spaces, or Tab).',
      'Click "Format JSON" to beautify or "Minify JSON" to compress.',
      'Inspect the hierarchical visual tree view of nested keys.',
      'Copy the output or download it directly.',
    ],
    howToUseAr: [
      'الصق كود JSON غير المنسق في مساحة الإدخال أو ارفع ملف JSON.',
      'اختر مسافة الإزاحة البادئة (مسافتين، 4 مسافات، أو Tab).',
      'اضغط "تنسيق JSON" للتجميل أو "تصغير JSON" للضغط.',
      'استعرض الهيكل الشجري التفاعلي للمفاتيح المتداخلة.',
      'انسخ الناتج المنسق أو قم بتنزيله مباشرة.',
    ],
    keywords: ['json', 'format', 'beautify', 'minify', 'pretty print', 'tree', 'payload', 'indent'],
    relatedTools: ['json-validator', 'sql-formatter', 'csv-json'],
    supportsCodeAnalysis: true,
    codeType: 'json',
  },
  {
    id: 'json-validator',
    name: 'JSON Validator',
    slug: 'json-validator',
    href: '/tools/json-validator',
    categoryId: 'database',
    categoryNameEn: 'Database Tools',
    categoryNameAr: 'أدوات قواعد البيانات',
    descriptionEn: 'Validate JSON syntax, pinpoint line and column error locations, auto-fix trailing commas, and audit JSON payloads.',
    descriptionAr: 'تدقيق وفحص صحة كود JSON واكتشاف أخطاء الأسطر والأعمدة وإصلاح الفواصل والاقتباسات تلقائياً.',
    capabilitiesEn: [
      'Pinpoint exact line and column coordinates for JSON syntax errors',
      'Auto-fix trailing commas, single quotes, and unquoted property keys in one click',
      'Audit structural statistics: root payload type, object key counts, max depth, and file size',
      'Provide actionable repair suggestions for missing quotes and brackets',
      '100% Client-side local parsing and privacy',
    ],
    capabilitiesAr: [
      'تحديد السطر والعمود بدقة لأخطاء صياغة JSON',
      'إصلاح تلقائي للفواصل الزائدة، الاقتباسات المفردة، والمفاتيح غير المعرفة بنقرة واحدة',
      'تحليل مصفوفة الهيكل: نوع الحمولة الأصلية، عدد المفاتيح، عمق التداخل وحجم الملف',
      'تقديم نصائح وتوجيهات تصحيح فورية عند وجود أقواس غير مغلقة',
      'معالجة وفحص محلي 100% لحماية خصوصية البيانات',
    ],
    howToUseEn: [
      'Paste your JSON payload into the validator input editor or load a file.',
      'View real-time syntax evaluation, line errors, and structural matrix stats.',
      'Click "Auto-Fix Syntax" to automatically strip trailing commas and fix quote errors.',
      'Copy or download your valid JSON file.',
    ],
    howToUseAr: [
      'الصق حمولة JSON في محرر التدقيق أو قم برفع ملف.',
      'استعرض النتيجة اللحظية وموقع السطر المصاب وإحصائيات الهيكل.',
      'اضغط "إصلاح الفواصل والاقتباسات" للتصحيح التلقائي.',
      'انسخ كود JSON السليم أو قم بتنزيله كملف.',
    ],
    keywords: ['json', 'validator', 'syntax', 'check', 'lint', 'auto fix', 'errors', 'audit'],
    relatedTools: ['csv-json', 'json-formatter', 'sql-formatter'],
    supportsCodeAnalysis: true,
    codeType: 'json',
  },
  {
    id: 'csv-json',
    name: 'CSV to JSON Converter',
    slug: 'csv-json',
    href: '/tools/csv-json',
    categoryId: 'database',
    categoryNameEn: 'Database Tools',
    categoryNameAr: 'أدوات قواعد البيانات',
    descriptionEn: 'Convert Excel CSV spreadsheet data into clean, structured JSON arrays with automatic type detection.',
    descriptionAr: 'تحويل جداول بيانات CSV والإكسيل إلى مصفوفات JSON مرتبة مع اكتشاف أنواع البيانات تلقائياً.',
    capabilitiesEn: [
      'Convert CSV text or uploaded files into JSON arrays or objects',
      'Automatic type detection (numbers, booleans, nulls, dates, strings)',
      'Custom delimiter options (comma, semicolon, tab, pipe)',
      'Option to toggle header row detection and transpose structure',
      'Live interactive table preview of parsed CSV rows',
    ],
    capabilitiesAr: [
      'تحويل نصوص أو ملفات CSV إلى مصفوفات وكائنات JSON منظمة',
      'اكتشاف أنواع البيانات تلقائياً (أرقام، قيم منطقية، نصوص، تواريخ)',
      'تخصيص الفواصل (فاصلة، فاصلة منقوطة، Tab، شريط عامودي)',
      'إمكانية استخدام الصف الأول كعناوين أعمدة (Headers)',
      'معاينة جدولية حية للبيانات قبل التصدير والتحويل',
    ],
    howToUseEn: [
      'Paste CSV content or upload a .csv file.',
      'Choose the column separator delimiter if not auto-detected.',
      'Configure options such as parsing numbers or handling empty cells.',
      'Inspect the converted JSON output in the preview panel.',
      'Copy or download the resulting JSON file.',
    ],
    howToUseAr: [
      'الصق محتوى CSV أو ارفع ملف .csv.',
      'حدد الفاصل بين الأعمدة إذا لم يتم اكتشافه تلقائياً.',
      'اضبط خيارات المعالجة مثل تحويل الأرقام التلقائي أو معالجة الحقول الفارغة.',
      'عاين مصفوفة JSON الناتجة في لوحة العرض.',
      'انسخ الناتج أو نزّل ملف JSON مباشرة.',
    ],
    keywords: ['csv', 'json', 'convert', 'converter', 'excel', 'spreadsheet', 'transform', 'table', 'data transform'],
    relatedTools: ['json-formatter', 'document-converter'],
    supportsCodeAnalysis: true,
    codeType: 'csv',
  },
  {
    id: 'jwt',
    name: 'JWT Decoder/Encoder',
    slug: 'jwt',
    href: '/tools/jwt',
    categoryId: 'developer',
    categoryNameEn: 'Developer Utilities',
    categoryNameAr: 'أدوات المطورين',
    descriptionEn: 'Decode, encode, verify, and inspect JSON Web Tokens (JWT) headers and payloads securely in your browser.',
    descriptionAr: 'فك وتشفير والتحقق من صحة وفحص رموز JSON Web Tokens (JWT) بأمان تام داخل المتصفح.',
    capabilitiesEn: [
      'Decode header and payload claims instantly from encoded tokens',
      'Human-readable timestamps for exp, iat, and nbf claims with expiry alerts',
      'Verify HMAC signatures (HS256, HS384, HS512) with secret keys',
      'Generate/encode new JWT tokens with custom claims and secret',
      '100% client-side execution — token secrets never leave your device',
    ],
    capabilitiesAr: [
      'فك تشفير ترويسة ومحتويات Payload الخاصة بالـ Token فورياً',
      'عرض أوقات الصلاحية (exp, iat) بتوقيت بشري واضح مع تنبيهات انتهاء الصلاحية',
      'التحقق من التوقيع الرقمي (HS256, HS384, HS512) بواسطة المفتاح السري',
      'إنشاء وتشفير JWT جديد بحقول ومطالبات مخصصة ومفتاح توقيع',
      'معالجة آمنة 100% داخل المتصفح — الرموز والمفاتيح لا تغادر جهازك أبداً',
    ],
    howToUseEn: [
      'Paste an encoded JWT string into the token input field.',
      'The Header and Payload JSON structures will be decoded immediately.',
      'Inspect token expiration countdown and claim details.',
      'Optionally enter a secret key to verify the HMAC signature.',
    ],
    howToUseAr: [
      'الصق رمز JWT المشفر في حقل الإدخال.',
      'سيتم فك وفصل الترويسة (Header) ومحتوى (Payload) فوراً إلى JSON منسق.',
      'افحص وقت انتهاء صلاحية التوكن والبيانات المضمنة.',
      'اختيارياً أدخل المفتاح السري (Secret Key) للتحقق من صحة التوقيع الرقمي.',
    ],
    keywords: ['jwt', 'token', 'auth', 'bearer', 'decode', 'encode', 'verify', 'json web token', 'signature', 'claims', 'exp', 'hs256'],
    relatedTools: ['base64', 'hash-generator', 'json-formatter'],
    supportsCodeAnalysis: true,
    codeType: 'jwt',
  },
  {
    id: 'base64',
    name: 'Base64 Encoder/Decoder',
    slug: 'base64',
    href: '/tools/base64',
    categoryId: 'developer',
    categoryNameEn: 'Developer Utilities',
    categoryNameAr: 'أدوات المطورين',
    descriptionEn: 'Encode and decode Base64 strings, texts, images, and binary files with UTF-8 and URL-safe options.',
    descriptionAr: 'تشفير وفك تشفير نصوص Base64 والصور والملفات الثنائية مع دعم UTF-8 والروابط الآمنة URL-Safe.',
    capabilitiesEn: [
      'Encode plain text to Base64 with full UTF-8 Unicode support',
      'Decode Base64 strings back to clean readable text',
      'URL-safe Base64 mode (replacing +/ with -_ and optional padding)',
      'Convert files or images directly to Base64 Data URLs',
      'Live character counters and instant bidirectional conversion',
    ],
    capabilitiesAr: [
      'تشفير النصوص العادية إلى Base64 مع دعم كامل لأحرف UTF-8 واللغة العربية',
      'فك تشفير سلاسل Base64 إلى نصوص مقروءة وواضحة',
      'وضع URL-Safe للروابط والويب (استبدال +/ بـ -_ وإزالة الـ padding)',
      'تحويل الملفات والصور مباشرة إلى صيغة Base64 Data URL',
      'عداد فوري للأحرف وتحويل ثنائي الاتجاه فوري',
    ],
    howToUseEn: [
      'Type or paste text into the input field or drag a file.',
      'Choose the operation mode: "Encode" or "Decode".',
      'Toggle URL-Safe encoding if needed for query strings or URLs.',
      'Copy the output or download as a text/binary file.',
    ],
    howToUseAr: [
      'اكتب أو الصق النص في حقل الإدخال أو اسحب ملفاً.',
      'اختر نوع العملية: "تشفير (Encode)" أو "فك التشفير (Decode)".',
      'فعل خيار URL-Safe إذا كنت تستخدم النص في الروابط.',
      'انسخ النتيجة أو نزلها كملف مباشرة.',
    ],
    keywords: ['base64', 'encode', 'decode', 'binary', 'ascii', 'utf-8', 'url safe', 'data uri', 'string'],
    relatedTools: ['jwt', 'hash-generator', 'binary-translator'],
    supportsCodeAnalysis: true,
    codeType: 'base64',
  },
  {
    id: 'binary-translator',
    name: 'Binary Translator',
    slug: 'binary-translator',
    href: '/tools/binary-translator',
    categoryId: 'developer',
    categoryNameEn: 'Developer Utilities',
    categoryNameAr: 'أدوات المطورين',
    descriptionEn: 'Translate text to binary and binary back to text, byte by byte with bit inspection and UTF-8 multi-byte support.',
    descriptionAr: 'تحويل النصوص إلى لغة الآلة الثنائية (0 و 1) والعكس بايت ببايت مع فحص البتات ودعم كامل لـ UTF-8.',
    capabilitiesEn: [
      'Bidirectional Text to Binary and Binary to Text translation',
      'Byte-by-byte visual breakdown with bit-level place values (128 down to 1)',
      'Custom byte separators (spaces, commas, hyphens, none, newlines)',
      'Prefix support (0b format) and bit width options (8-bit, 7-bit, 16-bit)',
      '100% client-side multi-byte UTF-8, Arabic script, and emoji translation',
      'Real-time binary syntax diagnostics and auto-padding features',
    ],
    capabilitiesAr: [
      'تحويل ثنائي الاتجاه من نص إلى ثنائي ومن ثنائي إلى نص',
      'تفكيك بايت ببايت وعرض مرئي لقيم البتات المكانية (من 128 إلى 1)',
      'فواصل بايت مخصصة (مسافات، فواصل، شُرط، بدون فواصل، أسطر جديدة)',
      'دعم بادئة 0b وتحديد عرض البتات (8 بت، 7 بت، 16 بت)',
      'معالجة محلية 100% للغة العربية والإيموجي وترميز UTF-8 متعدد البايتات',
      'فحص فوري لصحة الكود الثنائي مع ميزة التعبئة التلقائية بالأصفار',
    ],
    howToUseEn: [
      'Select translation mode: "Text to Binary" or "Binary to Text".',
      'Type or paste your content in the input field.',
      'Configure byte separator, bit width, and encoding.',
      'Inspect each byte in the interactive Byte Inspector table.',
      'Copy the translated output or download it as a file.',
    ],
    howToUseAr: [
      'اختر وضع التحويل: "نص إلى ثنائي" أو "ثنائي إلى نص".',
      'اكتب أو الصق المحتوى في حقل الإدخال.',
      'خصص فاصل البايتات وعرض البت وترميز النصوص.',
      'افحص كل بايت بالتفصيل في جدول فاحص البايتات التفاعلي.',
      'انسخ النتيجة أو نزلها كملف بنقرة واحدة.',
    ],
    keywords: ['binary', 'translator', 'text to binary', 'binary to text', 'bits', 'bytes', 'ascii', 'utf8', 'nibble', '0101'],
    relatedTools: ['base64', 'hash-generator', 'uuid-generator'],
    supportsCodeAnalysis: true,
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    slug: 'regex-tester',
    href: '/tools/regex-tester',
    categoryId: 'developer',
    categoryNameEn: 'Developer Utilities',
    categoryNameAr: 'أدوات المطورين',
    descriptionEn: 'Test, evaluate, and debug regular expressions with instant visual highlighting, match groups, and cheat sheet.',
    descriptionAr: 'فحص واختبار وتصحيح التعابير النمطية Regular Expressions مع تمييز فوري للمطابقات والمجموعات وقائمة مرجعية.',
    capabilitiesEn: [
      'Real-time regular expression pattern matching and validation',
      'Interactive flag selection: Global (g), Case-insensitive (i), Multiline (m), DotAll (s), Unicode (u)',
      'Capturing group breakdowns with indexes and matched sub-strings',
      'Built-in Regex Cheat Sheet with common patterns (email, URL, phone, IP, hex, dates)',
      'Detailed match statistics and error explanation on invalid patterns',
    ],
    capabilitiesAr: [
      'مطابقة واختبار التعابير النمطية فورياً أثناء الكتابة',
      'تحديد خيارات وأعلام الـ Regex: عام (g)، غير حساس لحالة الأحرف (i)، متعدد الأسطر (m)، شامل (s)، يونيكود (u)',
      'تفصيل مجموعات الالتقاط (Capturing Groups) ومواضعها داخل النص',
      'دليل مرجعي مدمج للأنماط الشائعة (البريد، الروابط، أرقام الهواتف، عناوين IP، التواريخ)',
      'إحصائيات المطابقة وشرح أخطاء الصياغة في النمط',
    ],
    howToUseEn: [
      'Enter your regular expression pattern in the pattern input box.',
      'Select any relevant regex flags (e.g. g for global, i for case-insensitive).',
      'Type or paste your test string in the test area.',
      'Review the highlighted matches and inspection table below.',
      'Click common pattern presets in the cheat sheet for quick templates.',
    ],
    howToUseAr: [
      'أدخل نمط التعبير النمطي في حقل الـ Pattern.',
      'حدد الأعلام المطلوبة (مثل g للمطابقة الشاملة أو i لتجاهل حالة الأحرف).',
      'الصق أو اكتب نص الاختبار في مساحة الفحص.',
      'عاين المطابقات المظللة وجدول المجموعات التفصيلي.',
      'استخدم القوالب الجاهزة من الدليل المرجعي لأنماط البريد والروابط وغيرها.',
    ],
    keywords: ['regex', 'regular expression', 'pattern', 'test', 'matcher', 'debug', 'flags', 'groups', 'email regex', 'url regex'],
    relatedTools: ['base64', 'json-formatter'],
    supportsCodeAnalysis: true,
    codeType: 'regex',
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    slug: 'uuid-generator',
    href: '/tools/uuid-generator',
    categoryId: 'developer',
    categoryNameEn: 'Developer Utilities',
    categoryNameAr: 'أدوات المطورين',
    descriptionEn: 'Generate cryptographically secure RFC 4122 UUID v4 tokens individually or in bulk.',
    descriptionAr: 'توليد معرفات فريدة عالمياً UUID v4 مطابقة لمعيار RFC 4122 بشكل فردي أو بالدُفعات.',
    capabilitiesEn: [
      'Generate version 4 UUIDs using window.crypto CSPRNG',
      'Bulk generation up to 500 UUIDs at once',
      'Custom formatting: uppercase/lowercase, with or without hyphens, braces, quotes, commas',
      'One-click copy all or individual UUIDs',
      'Export generated UUID lists as JSON, CSV, or plain TXT',
    ],
    capabilitiesAr: [
      'توليد معرفات UUID v4 عشوائية آمنة تشفيرياً',
      'توليد بالدُفعات حتى 500 معرف دفعة واحدة',
      'خيارات تنسيق: أحرف كبيرة/صغيرة، مع أو بدون شرطات (-)، أقواس، فواصل',
      'نسخ فردي أو نسخ القائمة كاملة بنقرة واحدة',
      'تصدير كملفات JSON أو CSV أو نصوص TXT',
    ],
    howToUseEn: [
      'Select the number of UUIDs you want to generate.',
      'Choose formatting options (e.g. uppercase, include hyphens, JSON array format).',
      'Click "Generate UUIDs" to create fresh tokens.',
      'Click "Copy All" or download the generated list.',
    ],
    howToUseAr: [
      'حدد عدد المعرفات المراد توليدها.',
      'اختر تفضيلات التنسيق (أحرف كبيرة، وجود الشرطات، أو صيغة مصفوفة JSON).',
      'اضغط "توليد UUIDs" لإنشاء المعرفات.',
      'اضغط "نسخ الكل" أو قم بتنزيل القائمة.',
    ],
    keywords: ['uuid', 'guid', 'v4', 'unique identifier', 'generator', 'bulk uuid', 'crypto', 'random'],
    relatedTools: ['hash-generator', 'base64'],
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    slug: 'hash-generator',
    href: '/tools/hash-generator',
    categoryId: 'developer',
    categoryNameEn: 'Developer Utilities',
    categoryNameAr: 'أدوات المطورين',
    descriptionEn: 'Generate cryptographic hash digests (MD5, SHA-1, SHA-256, SHA-512, SHA-3, RIPEMD160) for texts and strings.',
    descriptionAr: 'توليد الهاش والتشفير الرياضي (MD5, SHA-1, SHA-256, SHA-512, SHA-3) للنصوص والبيانات.',
    capabilitiesEn: [
      'Calculate multiple hashes simultaneously (MD5, SHA-1, SHA-256, SHA-512, SHA-3, RIPEMD160)',
      'HMAC keyed hashing support for secure API message signing',
      'Compare hashes with expected checksums to verify integrity',
      'Supports uppercase and lowercase hex representations',
      '100% private in-browser computation with zero server requests',
    ],
    capabilitiesAr: [
      'حساب بصمات الهاش المتعددة معاً (MD5, SHA-1, SHA-256, SHA-512, SHA-3)',
      'دعم HMAC مع مفتاح سري لتوقيع رسائل الـ API والتحقق منها',
      'مقارنة الهاش مع قيمة سابقة للتحقق من سلامة البيانات (Checksum)',
      'عرض الهاش بأحرف كبيرة أو صغيرة',
      'معالجة محلية بالكامل داخل المتصفح دون إرسال النصوص لأي سيرفر',
    ],
    howToUseEn: [
      'Type or paste the input text to hash.',
      'Optionally enter a secret HMAC key if generating a keyed hash.',
      'View all calculated hash digests instantly.',
      'Copy the required hash (e.g. SHA-256) with one click.',
    ],
    howToUseAr: [
      'اكتب أو الصق النص المراد حساب الهاش له.',
      'اختيارياً أدخل مفتاح HMAC السري إذا كنت تريد إنشاء توقيع مشفر.',
      'عاين جميع بصمات التشفير المحسوبة فوراً.',
      'انسخ الهاش المطلوب (مثل SHA-256 أو MD5) بنقرة واحدة.',
    ],
    keywords: ['hash', 'md5', 'sha256', 'sha512', 'sha1', 'sha3', 'crypto', 'digest', 'checksum', 'hmac'],
    relatedTools: ['uuid-generator', 'jwt', 'base64'],
  },
  {
    id: 'document-converter',
    name: 'Document & Office Converter',
    slug: 'document-converter',
    href: '/tools/document-converter',
    categoryId: 'files',
    categoryNameEn: 'File Utilities',
    categoryNameAr: 'أدوات الملفات والمستندات',
    descriptionEn: 'Convert between PDF, Word (DOCX), Excel (XLSX), PowerPoint (PPTX), HTML, and JPG/PNG documents with a full format matrix.',
    descriptionAr: 'التحويل الشامل بين ملفات PDF، وورد (DOCX)، إكسيل (XLSX)، باوربوينت (PPTX)، HTML، وصور JPG/PNG.',
    capabilitiesEn: [
      'Universal matrix: Convert between PDF, DOCX, XLSX, PPTX, HTML, and Images',
      'Convert PowerPoint PPTX into interactive HTML slides, text outlines, or PDF decks',
      'Convert Excel spreadsheets into responsive HTML tables or PDFs',
      'Convert Word DOCX to clean HTML or PDF',
      'Convert PDF pages into images or extract document text',
      '100% private in-browser processing — files never leave your device',
    ],
    capabilitiesAr: [
      'مصفوفة تحويل شاملة: التحويل بين PDF و Word و Excel و PowerPoint و HTML والصور',
      'تحويل عروض باوربوينت PPTX إلى شرائح HTML تفاعلية أو مستندات PDF',
      'تحويل جداول إكسيل XLSX إلى جداول HTML متجاوبة أو ملفات PDF',
      'تحويل مستندات وورد DOCX إلى HTML نظيف أو PDF',
      'تحويل صفحات PDF إلى صور أو استخراج النصوص منها',
      'خصوصية تامة 100% داخل المتصفح — ملفاتك لا ترفع لأي خادم',
    ],
    howToUseEn: [
      'Select your source file type (e.g. Word DOCX, PDF, Excel XLSX, PPTX).',
      'Select your target conversion format.',
      'Upload or drag your document into the drop zone.',
      'Inspect the live interactive preview.',
      'Click convert and download the converted document.',
    ],
    howToUseAr: [
      'اختر نوع الملف الأصلي (مثل Word DOCX أو PDF أو Excel XLSX أو PPTX).',
      'اختر الصيغة المستهدفة للتحويل.',
      'ارفع المستند أو اسحبه إلى منطقة الرفع.',
      'عاين النتيجة في نافذة المعاينة التفاعلية.',
      'اضغط تحويل وقم بتنزيل المستند الجديد.',
    ],
    keywords: ['document converter', 'word to pdf', 'pdf to word', 'docx', 'pptx to pdf', 'xlsx to pdf', 'excel to html', 'pdf to image', 'office converter', 'powerpoint'],
    relatedTools: ['pdf-merge', 'image-converter', 'image-and-file-compressor'],
  },
  {
    id: 'image-converter',
    name: 'Universal Image Converter',
    slug: 'image-converter',
    href: '/tools/image-converter',
    categoryId: 'files',
    categoryNameEn: 'File Utilities',
    categoryNameAr: 'أدوات الملفات والمستندات',
    descriptionEn: 'Convert between 14 core image formats: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS.',
    descriptionAr: 'التحويل بين 14 صيغة صور مختلفة: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, XPS بأمان وسرعة.',
    capabilitiesEn: [
      'Bidirectional conversion across 14 image formats',
      'Photoshop PSD, macOS ICNS, Windows ICO, and PostScript support',
      'Preserve transparency for PNG, WebP, AVIF, ICO, and PSD',
      'Batch conversion: upload multiple pictures and export as single ZIP',
      'Custom quality sliders and resolution settings',
      'In-browser canvas and WebAssembly decoding for maximum privacy',
    ],
    capabilitiesAr: [
      'تحويل ثنائي الاتجاه بين 14 صيغة صور',
      'دعم ملفات فوتوشوب PSD وأيقونات ماك ICNS وأيقونات ويندوز ICO',
      'الحفاظ على الخلفية الشفافة لصيغ PNG و WebP و AVIF و ICO و PSD',
      'تحويل بالدفعات: رفع صور متعددة وتنزيلها معاً في ملف ZIP',
      'التحكم في جودة ودقة الصورة قبل التصدير',
      'معالجة سريعة وآمنة محلياً 100% داخل المتصفح',
    ],
    howToUseEn: [
      'Upload one or more images into the upload area.',
      'Select your desired output format (e.g. WebP, PNG, JPG, ICO, AVIF).',
      'Adjust quality settings if desired.',
      'Click convert and download your converted images individually or as a ZIP archive.',
    ],
    howToUseAr: [
      'ارفع صورة واحدة أو عدة صور في منطقة الرفع.',
      'اختر صيغة الإخراج المطلوبة (مثل WebP أو PNG أو JPG أو ICO أو AVIF).',
      'اضبط نسبة الجودة حسب رغبتك.',
      'اضغط تحويل ونزل الصور محولة بشكل فردي أو كملف مضغوط ZIP.',
    ],
    keywords: ['image converter', 'png to webp', 'jpg to png', 'avif', 'ico converter', 'psd converter', 'icns', 'tiff', 'gif', 'bmp', 'webp converter'],
    relatedTools: ['image-resizer', 'image-and-file-compressor', 'document-converter'],
  },
  {
    id: 'pdf-merge',
    name: 'PDF Merger & Organizer',
    slug: 'pdf-merge',
    href: '/tools/pdf-merge',
    categoryId: 'files',
    categoryNameEn: 'File Utilities',
    categoryNameAr: 'أدوات الملفات والمستندات',
    descriptionEn: 'Merge multiple PDF files, reorder pages, remove unwanted sheets, and organize documents with intuitive drag-and-drop.',
    descriptionAr: 'دمج وتجميع ملفات PDF وإعادة ترتيب الصفحات وحذف الصفحات غير المرغوبة بسهولة بالسحب والإفلات.',
    capabilitiesEn: [
      'Combine multiple PDF documents into a single cohesive PDF file',
      'Visual thumbnail page reordering and drag-and-drop',
      'Delete individual pages or rotate pages before merging',
      'Instant client-side PDF generation using pdf-lib',
      'Zero document uploads — your contracts and private files stay on your machine',
    ],
    capabilitiesAr: [
      'دمج ملفات PDF متعددة في ملف PDF واحد متكامل',
      'معاينة مصغرة لجميع الصفحات مع إمكانية ترتيبها بالسحب والإفلات',
      'حذف صفحات معينة أو تدوير الصفحات قبل الدمج',
      'توليد فوري لملف الـ PDF المدمج باستخدام تقنيات المتصفح الحديثة',
      'أمان تام وخصوصية مطلقة — مستنداتك وعقودك لا ترفع إلى أي سيرفر',
    ],
    howToUseEn: [
      'Drop your PDF files into the upload box.',
      'Reorder the files or expand them to rearrange individual pages.',
      'Delete any unwanted pages with the trash icon.',
      'Click "Merge PDFs" to build the unified PDF file.',
      'Download your merged PDF document immediately.',
    ],
    howToUseAr: [
      'اسحب ملفات PDF إلى منطقة الرفع.',
      'رتب الملفات أو وسّعها لتغيير ترتيب الصفحات الفردية.',
      'احذف أي صفحات غير مرغوبة بنقر أيقونة الحذف.',
      'اضغط "دمج ملفات PDF" لإنشاء الملف الموحد.',
      'قم بتنزيل مستند PDF المدمج فوراً.',
    ],
    keywords: ['pdf merge', 'combine pdf', 'join pdf', 'organize pdf', 'reorder pdf pages', 'split pdf', 'pdf tool'],
    relatedTools: ['document-converter', 'image-and-file-compressor'],
  },
  {
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    slug: 'qr-code-generator',
    href: '/tools/qr-code-generator',
    categoryId: 'files',
    categoryNameEn: 'File Utilities',
    categoryNameAr: 'أدوات الملفات والمستندات',
    descriptionEn: 'Create custom branded QR codes for URLs, WiFi networks, vCards, emails, phone numbers, and plain texts with logos and styling.',
    descriptionAr: 'تصميم وإنشاء رموز QR مخصصة للروابط وشبكات الواي فاي وبطاقات الاتصال vCard مع تخصيص الألوان والشعارات.',
    capabilitiesEn: [
      'Generate QR codes for URLs, WiFi credentials, vCard contact cards, email, SMS, and text',
      'Custom styling: foreground/background colors, corner dot shapes, and error correction levels (L, M, Q, H)',
      'Embed custom center logos or business branding',
      'Download in high-resolution PNG, SVG, or PDF formats',
      'Saved cards presets and automatic scan history',
    ],
    capabilitiesAr: [
      'إنشاء رموز QR للروابط وشبكات WiFi وبطاقات الأعمال vCard والبريد والرسائل والنصوص',
      'تخصيص الألوان (أمامي/خلفي)، أشكال النقاط والزوايا، ومستويات تصحيح الأخطاء (L, M, Q, H)',
      'إدراج شعار أو صورة مخصصة في منتصف الرمز',
      'تصدير بجودة فائقة بصيغ PNG أو SVG أو PDF',
      'حفظ بطاقات الأعمال وسجل الرموز المنشأة مسبقاً',
    ],
    howToUseEn: [
      'Choose the QR code type (URL, WiFi, vCard, Text, Phone, Email).',
      'Enter the required information in the fields.',
      'Customize colors, error correction, and add an optional center logo.',
      'Preview the generated QR code in real-time.',
      'Download the QR code as PNG or SVG.',
    ],
    howToUseAr: [
      'اختر نوع رمز الـ QR (رابط، واي فاي، بطاقة عمل vCard، نص، هاتف، بريد).',
      'أدخل البيانات المطلوبة في الحقول.',
      'خصص الألوان، مستوى تصحيح الخطأ، وأضف شعاراً في المنتصف إن رغبت.',
      'عاين الرمز مباشرة.',
      'نزّل رمز الـ QR بصيغة PNG أو SVG.',
    ],
    keywords: ['qr code', 'generator', 'wifi qr', 'vcard', 'barcode', 'qr maker', 'branding', 'svg qr', 'png qr'],
    relatedTools: ['qr-barcode-scanner'],
  },
  {
    id: 'qr-barcode-scanner',
    name: 'QR & Barcode Scanner',
    slug: 'qr-barcode-scanner',
    href: '/tools/qr-barcode-scanner',
    categoryId: 'files',
    categoryNameEn: 'File Utilities',
    categoryNameAr: 'أدوات الملفات والمستندات',
    descriptionEn: 'Scan and decode QR codes, UPC, EAN, Code 128, and 1D/2D barcodes in real time using webcam, image uploads, or clipboard paste.',
    descriptionAr: 'قراءة وفحص أكواد QR والباركود (EAN, UPC, Code 128) مباشرة عبر الكاميرا أو رفع الصور أو اللصق من الحافظة.',
    capabilitiesEn: [
      'Live camera scanner with multi-format detection and camera switcher',
      'Decode barcodes from uploaded image files or drag-and-drop',
      'Direct clipboard image paste (Ctrl+V) for instant scanning',
      'Supports 1D & 2D formats: QR Code, UPC-A, UPC-E, EAN-13, EAN-8, Code 128, Code 39, ITF, Aztec, Data Matrix',
      'Structured payload parsing: URLs, WiFi auto-connect info, vCards, phone numbers',
      'Scan history with search and export capabilities',
    ],
    capabilitiesAr: [
      'مسح حي عبر كاميرا الجهاز مع دعم التبديل بين الكاميرات',
      'قراءة الباركود من الصور المرفوعة أو بالسحب والإفلات',
      'لصق مباشر للصور من الحافظة (Ctrl+V) للفحص الفوري',
      'دعم كافة تنسيقات الباركود 1D و 2D: QR Code و EAN-13 و UPC و Code 128 و Code 39 و Data Matrix',
      'تحليل ذكي للمحتوى: روابط إنترنت، بيانات WiFi، بطاقات اتصال vCard، أرقام هواتف',
      'سجل تاريخي للمسوحات مع إمكانية البحث والتصدير',
    ],
    howToUseEn: [
      'Choose your scanning mode: Camera, Image Upload, or Paste from Clipboard.',
      'Point your camera at the QR code/barcode or upload an image containing one.',
      'The scanner will decode and display the content immediately.',
      'Click the parsed actions (open URL, copy text, view WiFi details).',
    ],
    howToUseAr: [
      'اختر طريقة المسح: الكاميرا، رفع صورة، أو اللصق من الحافظة.',
      'وجه الكاميرا نحو الرمز أو ارفع صورة تحتوي على كود أو باركود.',
      'سيقوم الماسح بفك المحتوى وعرضه فوراً.',
      'استخدم الإجراءات السريعة (فتح الرابط، نسخ المحتوى، عرض بيانات WiFi).',
    ],
    keywords: ['qr scanner', 'barcode scanner', 'barcode reader', 'upc', 'ean', 'code 128', 'webcam qr', 'scan barcode', 'camera scan'],
    relatedTools: ['qr-code-generator'],
  },
  {
    id: 'image-and-file-compressor',
    name: 'Image & File Compressor',
    slug: 'image-and-file-compressor',
    href: '/tools/image-and-file-compressor',
    categoryId: 'files',
    categoryNameEn: 'File Utilities',
    categoryNameAr: 'أدوات الملفات والمستندات',
    descriptionEn: 'Compress images (JPG, PNG, WebP) and pack files into optimized ZIP archives with instant byte-level size reduction.',
    descriptionAr: 'ضغط وتصغير حجم الصور (JPG, PNG, WebP) وتجميع وضغط الملفات في أرشيف ZIP بأعلى نسبة توفير للمساحة.',
    capabilitiesEn: [
      'Smart lossy and lossless image compression with customizable quality level',
      'Side-by-side visual comparison before and after compression',
      'Pack multiple files into compressed ZIP archives with deflation',
      'Live savings calculator showing percentage and megabytes saved',
      'Batch download all compressed files in one click',
    ],
    capabilitiesAr: [
      'ضغط ذكي للصور مع التحكم في نسبة الجودة وتوفير المساحة',
      'مقارنة بصرية جنباً إلى جنب قبل وبعد الضغط',
      'تجميع الملفات في أرشيف ZIP مضغوط عالي الكفاءة',
      'حاسبة فورية لحجم التوفير والنسبة المئوية المنخفضة',
      'تنزيل جميع الملفات المضغوطة دفعة واحدة',
    ],
    howToUseEn: [
      'Upload images or documents to compress.',
      'Adjust the target quality slider to balance size vs fidelity.',
      'Review the calculated savings and compressed file sizes.',
      'Download individual compressed files or download all in a ZIP.',
    ],
    howToUseAr: [
      'ارفع الصور أو الملفات المراد ضغطها.',
      'اضبط مؤشر الجودة لتحقيق التوازن بين صغر الحجم ووضوح الصورة.',
      'راجع حجم التوفير والمقاس الجديد للملفات.',
      'قم بتنزيل الملفات المضغوطة بشكل فردي أو مجمعة في ملف ZIP.',
    ],
    keywords: ['compress', 'image compressor', 'zip files', 'compressor', 'shrink image', 'reduce png size', 'jpg compressor', 'file optimizer'],
    relatedTools: ['image-converter', 'image-resizer'],
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    slug: 'image-resizer',
    href: '/tools/image-resizer',
    categoryId: 'files',
    categoryNameEn: 'File Utilities',
    categoryNameAr: 'أدوات الملفات والمستندات',
    descriptionEn: 'Resize, crop, and transform your images with custom dimensions, aspect ratios, and format conversion.',
    descriptionAr: 'تغيير أبعاد ومقاسات وقص الصور مع الحفاظ على تناسق الأبعاد ونقاء وجودة الصورة.',
    capabilitiesEn: [
      'Resize images by exact pixels (width/height) or by percentage (25%, 50%, 75%, 200%)',
      'Lock aspect ratio to prevent image distortion',
      'Standard social media presets (Instagram Square, Story, YouTube Banner, Twitter Header, Facebook Cover)',
      'Custom interactive visual cropping tool',
      'Export in JPG, PNG, or WebP with custom quality',
    ],
    capabilitiesAr: [
      'تغيير أبعاد الصور بالبكسل الدقيق (العرض/الارتفاع) أو بالنسب المئوية (50%, 75%, 200%)',
      'قفل نسبة العرض إلى الارتفاع لمنع تشوه الصورة',
      'مقاسات جاهزة لشبكات التواصل (Instagram, YouTube, Twitter/X, Facebook, LinkedIn)',
      'أداة قص تفاعلية متقدمة لتحديد الجزء المراد من الصورة',
      'تصدير بصيغ JPG أو PNG أو WebP مع التحكم في الجودة',
    ],
    howToUseEn: [
      'Upload your image into the workspace.',
      'Enter custom dimensions (width & height) or choose a preset aspect ratio.',
      'Optionally crop the image using the cropping frame.',
      'Select your output format (PNG, JPG, WebP) and quality.',
      'Download the resized image.',
    ],
    howToUseAr: [
      'ارفع صورتك في مساحة العمل.',
      'أدخل الأبعاد الجديدة (العرض والارتفاع) أو اختر قالباً جاهزاً لوسائل التواصل.',
      'قص الصورة اختيارياً باستخدام إطار القص التفاعلي.',
      'حدد صيغة الملف النهائي (PNG, JPG, WebP) ونسبة الجودة.',
      'قم بتنزيل الصورة بالحجم الجديد.',
    ],
    keywords: ['resize', 'image resizer', 'crop image', 'aspect ratio', 'scale photo', 'photo dimensions', 'social media crop'],
    relatedTools: ['image-converter', 'image-and-file-compressor'],
  },
  {
    id: 'image-color-palette',
    name: 'Image Color Palette Extractor',
    slug: 'image-color-palette',
    href: '/tools/image-color-palette',
    categoryId: 'files',
    categoryNameEn: 'File Utilities',
    categoryNameAr: 'أدوات الملفات والمستندات',
    descriptionEn: 'Extract dominant color palettes, HEX/RGB/HSL swatches, WCAG contrast scores, and export design tokens from any image in your browser.',
    descriptionAr: 'استخراج لوحات الألوان والدرجات السائدة (HEX/RGB/HSL) ودرجات التباين وتصدير كود CSS و Tailwind من أي صورة فورياً.',
    capabilitiesEn: [
      'Extract dominant color palettes using Median Cut, K-Means, Octree, or Vibrant quantization',
      'Interactive Loupe & Eyedropper to sample exact pixel colors with zoom and lock controls',
      'Generate complementary, analogous, triadic, tetradic, and monochromatic color harmonies',
      'WCAG contrast checker & colorblindness simulator (Protanopia, Deuteranopia, Tritanopia, Achromatopsia)',
      'Export design tokens as CSS Variables, Tailwind Config, SCSS, JSON, or downloadable Palette Card PNG',
      '100% Client-side local processing — image files are never uploaded to any server',
    ],
    capabilitiesAr: [
      'استخراج لوحات الألوان السائدة بخوارزميات Median Cut و K-Means و Octree و Vibrant',
      'عدسة مكبرة وأداة قطارة تفاعلية (Eyedropper) لاختيار لون أي بكسل مع التكبير والتثبيت',
      'توليد تناغمات وتناسقات الألوان (تكميلي، متجاور، ثلاثي، رباعي، وأحادي اللون)',
      'فحص تباين الألوان لمعايير WCAG ومحاكاة درجات عمى الألوان المختلفة',
      'تصدير الأكواد بصيغ CSS Variables و Tailwind Config و SCSS و JSON أو بطاقة لوحة ألوان PNG',
      'معالجة محلية بالكامل داخل المتصفح 100% لضمان أقصى درجات الخصوصية والأمان',
    ],
    howToUseEn: [
      'Upload an image (PNG, JPG, WebP, SVG, AVIF) or choose a sample photo.',
      'Select your preferred palette size (4 to 12 colors) and extraction algorithm.',
      'Use the interactive eyedropper on the photo to pick custom colors.',
      'Inspect color harmonies, WCAG accessibility contrast, and colorblind simulations.',
      'Copy color HEX/RGB/HSL codes or export CSS/Tailwind/JSON/PNG palette card.',
    ],
    howToUseAr: [
      'ارفع صورة (PNG, JPG, WebP, SVG, AVIF) أو اختر صورة تجريبية.',
      'حدد عدد الألوان المطلوبة في اللوحة (من 4 إلى 12 لوناً) واختر خوارزمية الاستخراج.',
      'استخدم القطارة التفاعلية فوق الصورة لالتقاط ألوان محددة بدقة.',
      'استعرض التناسقات اللونية، وفحص تباين إمكانية الوصول WCAG، ومحاكاة عمى الألوان.',
      'انسخ أكواد الألوان (HEX, RGB, HSL) أو صدّر كود CSS أو Tailwind أو بطاقة PNG.',
    ],
    keywords: [
      'color palette',
      'color extractor',
      'extract colors',
      'image colors',
      'eyedropper',
      'hex colors',
      'rgb',
      'hsl',
      'color harmonies',
      'color generator',
      'wcag contrast',
      'colorblind simulator',
      'tailwind colors',
      'css variables',
      'swatches',
      'palette card',
      'design tokens',
    ],
    relatedTools: ['image-converter', 'image-resizer', 'qr-code-generator'],
  },
  {
    id: 'kpi-calculator',
    name: 'CAC & LTV Calculator',
    slug: 'kpi-calculator',
    href: '/tools/kpi-calculator?tab=product',
    categoryId: 'calculators',
    categoryNameEn: 'Calculators',
    categoryNameAr: 'الحاسبات',
    descriptionEn: 'Calculate SaaS KPIs, Customer Acquisition Cost (CAC), Lifetime Value (LTV), and LTV:CAC ratios.',
    descriptionAr: 'حساب مؤشرات أداء البرمجيات SaaS وتكلفة اكتساب العميل (CAC) والقيمة الدائمة للعميل (LTV) ومعدل العائد.',
    capabilitiesEn: [
      'Calculate Customer Acquisition Cost (CAC) from sales and marketing spend',
      'Calculate Customer Lifetime Value (LTV) and average customer lifespan',
      'Compute the LTV:CAC health ratio with SaaS benchmarks and recommendations',
      'Calculate CAC Payback Period (months to recover acquisition costs)',
      'Interactive visual metric breakdowns and exportable business reports',
    ],
    capabilitiesAr: [
      'حساب تكلفة اكتساب العميل (CAC) من إجمالي مصاريف التسويق والمبيعات',
      'حساب القيمة الدائمة للعميل (LTV) ومتوسط عمر اشتراك العميل',
      'حساب نسبة LTV:CAC مع مقارنتها بالمعايير المثالية لشركات التقنية',
      'حساب فترة استرداد تكلفة الاكتساب CAC Payback Period بالأشهر',
      'مخططات بيانية تفاعلية وتقارير أعمال قابلة للتصدير والطباعة',
    ],
    howToUseEn: [
      'Enter your total sales & marketing spend and number of new customers acquired.',
      'Input average revenue per user (ARPU) and customer churn rate or gross margin.',
      'View calculated CAC, LTV, and LTV:CAC ratio instantly.',
      'Check health indicators and payback period advice.',
    ],
    howToUseAr: [
      'أدخل إجمالي تكاليف التسويق والمبيعات وعدد العملاء الجدد المكتسبين.',
      'أدخل متوسط إيراد العميل (ARPU) ومعدل الإلغاء (Churn Rate) أو هامش الربح.',
      'عاين مؤشرات CAC و LTV ونسبة العائد فورياً.',
      'راجع تقييم صحة المؤشرات وفترة استرداد التكلفة بالأشهر.',
    ],
    keywords: ['kpi', 'cac', 'ltv', 'saas metrics', 'churn', 'calculator', 'customer acquisition cost', 'lifetime value', 'business metrics'],
    relatedTools: ['profit-calculator', 'roi-calculator'],
  },
  {
    id: 'profit-calculator',
    name: 'Profit Margin Calculator',
    slug: 'profit-calculator',
    href: '/tools/kpi-calculator?tab=profit',
    categoryId: 'calculators',
    categoryNameEn: 'Calculators',
    categoryNameAr: 'الحاسبات',
    descriptionEn: 'Calculate gross profit, net margin percentage, markup rate, and total business revenue.',
    descriptionAr: 'حساب هامش الربح الإجمالي والصافي، ونسبة الهامش، ونسبة الإضافة (Markup)، وإجمالي الأرباح.',
    capabilitiesEn: [
      'Calculate gross profit and profit margin percentage from cost and selling price',
      'Calculate markup percentage over product cost',
      'Compute required selling price given desired target margin',
      'Visual breakdown chart of cost vs profit share',
    ],
    capabilitiesAr: [
      'حساب مجمل الربح ونسبة هامش الربح من التكلفة وسعر البيع',
      'حساب نسبة الإضافة (Markup Percentage) على تكلفة المنتجات',
      'حساب سعر البيع المطلوب للوصول لهامش ربح مستهدف',
      'مخطط تفاعلي لتوزيع التكلفة مقابل هامش الربح',
    ],
    howToUseEn: [
      'Enter your item cost price and selling price.',
      'Or enter cost and your target profit margin percentage.',
      'The calculator computes gross profit, margin %, and markup % automatically.',
    ],
    howToUseAr: [
      'أدخل سعر التكلفة وسعر البيع للمنتج.',
      'أو أدخل التكلفة مع نسبة هامش الربح التي تستهدفها.',
      'ستقوم الحاسبة بحساب صافي الربح ونسبة الهامش ونسبة الـ Markup تلقائياً.',
    ],
    keywords: ['profit margin', 'profit calculator', 'margin', 'markup', 'cost', 'revenue', 'gross profit', 'net margin', 'pricing'],
    relatedTools: ['roi-calculator', 'kpi-calculator'],
  },
  {
    id: 'roi-calculator',
    name: 'ROI Calculator',
    slug: 'roi-calculator',
    href: '/tools/kpi-calculator?tab=roi',
    categoryId: 'calculators',
    categoryNameEn: 'Calculators',
    categoryNameAr: 'الحاسبات',
    descriptionEn: 'Calculate return on investment (ROI), annualized ROI, net gain, and financial project performance.',
    descriptionAr: 'حساب العائد على الاستثمار (ROI)، والعائد السنوي، وصافي الربح، وتقييم أداء المشاريع الاستثمارية.',
    capabilitiesEn: [
      'Calculate total ROI percentage and net return from initial investment and final value',
      'Calculate annualized ROI accounting for investment time horizon',
      'Payback period and break-even estimation',
      'Visual comparison of gains versus invested capital',
    ],
    capabilitiesAr: [
      'حساب نسبة العائد على الاستثمار ROI وصافي العائد المالي',
      'حساب العائد السنوي المركب بناءً على مدة الاستثمار بالسنوات أو الأشهر',
      'تقدير نقطة التعادل وفترة استرداد رأس المال المستثمر',
      'رسم بياني لمقارنة الأرباح المكتسبة برأس المال الأصلي',
    ],
    howToUseEn: [
      'Enter the amount invested (initial cost).',
      'Enter the amount returned / final value of the investment.',
      'Optionally specify the investment duration in months or years.',
      'Review the calculated ROI %, annualized return, and net profit.',
    ],
    howToUseAr: [
      'أدخل قيمة المبلغ المستثمر (التكلفة الأولية).',
      'أدخل القيمة النهائية أو العائد المحقق من الاستثمار.',
      'حدد اختيارياً مدة الاستثمار بالأشهر أو السنوات.',
      'عاين نسبة العائد على الاستثمار والعائد السنوي وصافي الربح المحقق.',
    ],
    keywords: ['roi', 'return on investment', 'finance', 'investment calculator', 'annualized roi', 'capital gains', 'business calculator'],
    relatedTools: ['profit-calculator', 'kpi-calculator'],
  },
  {
    id: 'calorie-calculator',
    name: 'Calorie & BMR Calculator',
    slug: 'calorie-calculator',
    href: '/tools/calorie-calculator',
    categoryId: 'calculators',
    categoryNameEn: 'Calculators',
    categoryNameAr: 'الحاسبات',
    descriptionEn: 'Calculate daily calorie needs, Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), and custom macronutrient breakdowns.',
    descriptionAr: 'حساب الاحتياج اليومي من السعرات الحرارية، ومعدل الأيض الأساسي (BMR)، واستهلاك الطاقة اليومي (TDEE)، وتوزيع الماكروز.',
    capabilitiesEn: [
      'Calculate BMR using Mifflin-St Jeor and Harris-Benedict formulas',
      'Compute Total Daily Energy Expenditure (TDEE) based on activity level',
      'Personalized calorie targets for weight loss, maintenance, or muscle gain',
      'Macronutrient distribution recommendations (protein, carbs, fats in grams & calories)',
      'Metric and Imperial unit support (kg/cm vs lbs/feet/inches)',
    ],
    capabilitiesAr: [
      'حساب معدل الأيض الأساسي BMR بأحدث المعادلات العلمية المعتمدة',
      'حساب إجمالي استهلاك الطاقة اليومي TDEE بناءً على مستوى النشاط البدني',
      'أهداف سعرات مخصصة لإنقاص الوزن، الحفاظ على الوزن، أو بناء العضلات',
      'توزيع نسب العناصر الغذائية الكبرى (البروتين، الكربوهيدرات، الدهون بالجرام والسعرات)',
      'دعم النظام المتري (كجم/سم) والنظام الإمبراطوري (باوند/إنش)',
    ],
    howToUseEn: [
      'Enter your age, gender, height, and current weight.',
      'Select your weekly physical activity level.',
      'Choose your fitness goal (weight loss, maintenance, or muscle gain).',
      'Review your daily calorie target and custom macronutrient breakdown.',
    ],
    howToUseAr: [
      'أدخل العمر، الجنس، الطول، والوزن الحالي.',
      'اختر مستوى نشاطك البدني الأسبوعي.',
      'حدد هدفك الصحي (إنقاص الوزن، تثبيت الوزن، أو زيادة الكتلة العضلية).',
      'عاين جدول السعرات اليومية المستهدفة وتوزيع الجرامات للبروتين والكارب والدهون.',
    ],
    keywords: ['calorie', 'bmr', 'tdee', 'diet', 'macros', 'weight loss', 'nutrition', 'fitness calculator', 'protein calculator'],
    relatedTools: ['kpi-calculator'],
  },
]

/**
 * Get tool by slug or ID
 */
export function getToolKnowledge(slugOrId: string): ToolKnowledgeItem | undefined {
  if (!slugOrId) return undefined
  const cleaned = slugOrId.replace('/tools/', '').split('?')[0].trim()
  return DIGITALMIX_TOOLS_KNOWLEDGE.find(
    (t) => t.slug === cleaned || t.id === cleaned
  )
}

/**
 * Search and find best matching tools for a user query.
 */
export function findRecommendedTools(
  query: string,
  currentToolSlug?: string,
  limit = 3
): { tool: ToolKnowledgeItem; score: number; reasonEn: string; reasonAr: string }[] {
  if (!query || query.trim().length === 0) return []

  const q = query.toLowerCase().trim()
  const qTokens = q.split(/[\s,–—\->\/]+/).filter((t) => t.length > 1)

  const results: { tool: ToolKnowledgeItem; score: number; reasonEn: string; reasonAr: string }[] = []

  for (const tool of DIGITALMIX_TOOLS_KNOWLEDGE) {
    let score = 0

    // Exact name match
    if (tool.name.toLowerCase() === q || tool.slug === q) {
      score += 100
    } else if (tool.name.toLowerCase().includes(q)) {
      score += 50
    }

    // Token matching in name
    for (const token of qTokens) {
      if (tool.name.toLowerCase().includes(token)) score += 20
      if (tool.slug.includes(token)) score += 20
      if (tool.keywords.some((k) => k.toLowerCase() === token)) score += 15
      else if (tool.keywords.some((k) => k.toLowerCase().includes(token))) score += 8

      if (tool.descriptionEn.toLowerCase().includes(token)) score += 5
      if (tool.capabilitiesEn.some((c) => c.toLowerCase().includes(token))) score += 8
    }

    // Special natural language queries
    if ((q.includes('csv') && q.includes('json')) || q.includes('csv to json')) {
      if (tool.id === 'csv-json') score += 80
    }
    if (q.includes('sql') || q.includes('database') || q.includes('query')) {
      if (tool.id === 'sql-formatter') score += 70
    }
    if ((q.includes('json') && !q.includes('csv')) || q.includes('format json') || q.includes('validate json')) {
      if (tool.id === 'json-formatter') score += 70
    }
    if (q.includes('jwt') || q.includes('token') || q.includes('bearer') || q.includes('claims')) {
      if (tool.id === 'jwt') score += 80
    }
    if (q.includes('base64') || q.includes('decode string') || q.includes('encode string')) {
      if (tool.id === 'base64') score += 80
    }
    if (q.includes('regex') || q.includes('regular expression') || q.includes('pattern')) {
      if (tool.id === 'regex-tester') score += 80
    }
    if (q.includes('uuid') || q.includes('guid') || q.includes('unique id')) {
      if (tool.id === 'uuid-generator') score += 80
    }
    if (q.includes('hash') || q.includes('sha256') || q.includes('md5') || q.includes('checksum')) {
      if (tool.id === 'hash-generator') score += 80
    }
    if (q.includes('word') || q.includes('docx') || q.includes('pptx') || q.includes('powerpoint') || q.includes('excel to pdf')) {
      if (tool.id === 'document-converter') score += 80
    }
    if (q.includes('merge pdf') || q.includes('combine pdf') || q.includes('join pdf') || q.includes('organize pdf')) {
      if (tool.id === 'pdf-merge') score += 80
    }
    if (q.includes('qr code') || q.includes('create qr') || q.includes('wifi qr')) {
      if (tool.id === 'qr-code-generator') score += 80
    }
    if (q.includes('scan') || q.includes('scanner') || q.includes('barcode') || q.includes('read qr')) {
      if (tool.id === 'qr-barcode-scanner') score += 80
    }
    if (q.includes('compress') || q.includes('reduce size') || q.includes('zip')) {
      if (tool.id === 'image-and-file-compressor') score += 80
    }
    if (q.includes('resize') || q.includes('crop') || q.includes('dimensions')) {
      if (tool.id === 'image-resizer') score += 80
    }
    if (q.includes('convert image') || q.includes('webp') || q.includes('avif') || q.includes('png to jpg') || q.includes('psd') || q.includes('ico')) {
      if (tool.id === 'image-converter') score += 80
    }
    if (q.includes('palette') || q.includes('color') || q.includes('extract color') || q.includes('eyedropper') || q.includes('swatch') || q.includes('ألوان') || q.includes('باليت')) {
      if (tool.id === 'image-color-palette') score += 80
    }
    if (q.includes('cac') || q.includes('ltv') || q.includes('saas') || q.includes('churn')) {
      if (tool.id === 'kpi-calculator') score += 80
    }
    if (q.includes('profit') || q.includes('margin') || q.includes('markup')) {
      if (tool.id === 'profit-calculator') score += 80
    }
    if (q.includes('roi') || q.includes('return on investment') || q.includes('investment')) {
      if (tool.id === 'roi-calculator') score += 80
    }
    if (q.includes('calorie') || q.includes('bmr') || q.includes('tdee') || q.includes('diet') || q.includes('macros')) {
      if (tool.id === 'calorie-calculator') score += 80
    }

    if (score > 10) {
      results.push({
        tool,
        score,
        reasonEn: `Best match for "${query}" based on tool capabilities and keyword indexing.`,
        reasonAr: `الخيار الأنسب لبحثك "${query}" وفقاً لمميزات ووظائف الأداة.`,
      })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}
