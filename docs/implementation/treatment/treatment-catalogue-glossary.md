# Clinora Treatment catalogue glossary

Status: explanatory product glossary; clinical terminology review required

This glossary documents the Treatment catalogue currently implemented in:

```text
apps/frontend/src/features/treatment/model/treatment-catalogue.ts
```

It contains the supported treatment acts and clinical findings, their
categories, target scope, English meaning, French meaning, and Arabic meaning.
The catalogue code is the stable identifier used by the application; labels
may be improved without changing the code.

This is an explanatory glossary for Clinora's interface and data model. It is
not a billing dictionary, diagnostic standard, treatment protocol, or substitute
for review by a qualified dentist. French terms use standard clinical wording
where possible. Arabic labels use Modern Standard Arabic; clinics may later add
local terminology or transliteration preferences.

## Category glossary

| English category      | Français                     | العربية             | Scope                                                                           |
| --------------------- | ---------------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Preventive            | Préventif                    | وقائي               | Actions intended to prevent disease or reduce future risk.                      |
| Restorative           | Restaurateur / restauratrice | ترميمي              | Restores damaged tooth structure or replaces a defective restoration.           |
| Endodontic            | Endodontique                 | علاج جذور الأسنان   | Treats the pulp and root-canal system.                                          |
| Surgery               | Chirurgie orale              | جراحة الفم والأسنان | Surgical treatment involving removal or surgical access.                        |
| Implant               | Implantologie                | زراعة الأسنان       | Placement or management of dental implants and their components.                |
| Prosthodontic         | Prothétique                  | تعويضات سنية        | Replaces missing teeth or restores function with fixed or removable prostheses. |
| Orthodontic           | Orthodontique                | تقويمي              | Appliances or records related to tooth movement and alignment.                  |
| Status                | État                         | الحالة              | Describes the current condition or presence of a tooth or restoration.          |
| Caries & restorations | Caries et restaurations      | التسوس والترميمات   | Records caries and existing restorative work.                                   |
| Endodontic            | Endodontique                 | علاج جذور الأسنان   | Records pulp, apical, root-canal, and resorption findings.                      |
| Periodontal           | Parodontal                   | دواعم السن واللثة   | Records plaque, calculus, probing, gingiva, and periodontal support.            |
| Other                 | Autre                        | أخرى                | Other tooth, prosthesis, fracture, wear, colour, or orthodontic findings.       |

## How target scope is used

| Catalogue target | Français          | العربية       | Meaning                                                              |
| ---------------- | ----------------- | ------------- | -------------------------------------------------------------------- |
| Tooth            | Dent              | سن            | The whole tooth is the target.                                       |
| Surface          | Surface dentaire  | سطح السن      | One or more tooth surfaces are the target.                           |
| Arch             | Arcade dentaire   | قوس سني       | The upper or lower dental arch is the target.                        |
| Bridge           | Étendue du bridge | امتداد الجسر  | A contiguous bridge span is the target.                              |
| Periodontal      | Site parodontal   | موقع حول سني  | A periodontal measurement or site is the target.                     |
| Tooth region     | Région de la dent | منطقة من السن | A region such as incisal, occlusal, mesial, or distal is the target. |

# Treatment acts

Treatment acts represent care that is proposed, started, completed, cancelled,
or entered in error. A dentist-created act can be planned directly. An act
created by an assistant through a handoff remains a draft until the responsible
dentist approves it.

## Preventive acts

### `FISSURE_SEALING` — Fissure sealing

- Category: Preventive · Préventif · وقائي
- Target: Surface · Surface dentaire · سطح السن
- Français: Scellement des sillons
- العربية: إغلاق شقوق الأسنان أو ختمها
- Meaning: A thin protective material is placed in deep pits and fissures to
  reduce food retention and the risk of caries.
- Signification en français: Application d'un matériau protecteur dans les
  sillons et fissures afin de limiter la rétention alimentaire et le risque de
  carie.
- المعنى بالعربية: وضع مادة واقية رقيقة داخل الأخاديد والشقوق العميقة لتقليل
  احتباس الطعام وخطر التسوس.

## Restorative acts

### `DIRECT_FILLING` — Direct filling

- Category: Restorative · Restaurateur / restauratrice · ترميمي
- Target: Surface · Surface dentaire · سطح السن
- Français: Obturation directe / plombage direct
- العربية: حشوة مباشرة
- Meaning: A restorative material is placed directly in a prepared tooth cavity
  during the visit.
- Signification en français: Mise en place directe d'un matériau de restauration
  dans une cavité préparée de la dent au cours de la séance.
- المعنى بالعربية: وضع مادة ترميمية مباشرة داخل حفرة سنية محضّرة أثناء الزيارة.

### `CROWN` — Crown

- Category: Restorative · Restaurateur / restauratrice · ترميمي
- Target: Tooth · Dent · سن
- Français: Couronne dentaire
- العربية: تاج سني
- Meaning: A full-coverage restoration that covers and protects most or all of
  the visible tooth.
- Signification en français: Restauration couvrant la majeure partie ou la
  totalité de la partie visible de la dent afin de la protéger et de restaurer
  sa forme et sa fonction.
- المعنى بالعربية: ترميم يغطي معظم الجزء الظاهر من السن أو كله لحمايته واستعادة
  شكله ووظيفته.

### `INLAY` — Inlay

- Category: Restorative · Restaurateur / restauratrice · ترميمي
- Target: Tooth · Dent · سن
- Français: Inlay / incrustation intracoronaire
- العربية: إنلاي / ترميم داخلي غير مباشر
- Meaning: A custom-made restoration that fits inside the cusps of a tooth and
  replaces part of the internal tooth structure.
- Signification en français: Restauration personnalisée placée à l'intérieur des
  cuspides pour remplacer une partie de la structure interne de la dent.
- المعنى بالعربية: ترميم مُصنّع حسب القياس يوضع داخل حدبات السن ويعوّض جزءاً من
  بنيته الداخلية.

### `ONLAY` — Onlay

- Category: Restorative · Restaurateur / restauratrice · ترميمي
- Target: Surface · Surface dentaire · سطح السن
- Français: Onlay / incrustation avec recouvrement cuspidien
- العربية: أونلاي / ترميم يغطي حدبات السن
- Meaning: A custom-made restoration that replaces a larger area than an inlay
  and covers one or more weakened cusps.
- Signification en français: Restauration personnalisée plus étendue qu'un
  inlay, recouvrant une ou plusieurs cuspides fragilisées.
- المعنى بالعربية: ترميم مُصنّع حسب القياس يغطي مساحة أكبر من الإنلاي ويغطي
  حدبة أو عدة حدبات ضعيفة.

### `VENEER` — Veneer

- Category: Restorative · Restaurateur / restauratrice · ترميمي
- Target: Tooth · Dent · سن
- Français: Facette dentaire
- العربية: قشرة سنية / عدسة سنية
- Meaning: A thin covering bonded mainly to the front surface of a tooth to
  improve its shape, colour, or appearance.
- Signification en français: Fine restauration collée principalement sur la face
  visible de la dent pour modifier sa forme, sa teinte ou son apparence.
- المعنى بالعربية: غطاء رقيق يُلصق غالباً على السطح الأمامي للسن لتحسين شكله أو
  لونه أو مظهره.

### `CROWN_REPLACEMENT` — Crown replacement

- Category: Restorative · Restaurateur / restauratrice · ترميمي
- Target: Tooth · Dent · سن
- Français: Remplacement de couronne
- العربية: استبدال التاج السني
- Meaning: Removal or replacement planning for an existing crown that is worn,
  damaged, leaking, or no longer suitable.
- Signification en français: Planification du retrait et du remplacement d'une
  couronne existante devenue usée, endommagée, non étanche ou inadaptée.
- المعنى بالعربية: التخطيط لإزالة واستبدال تاج موجود أصبح متآكلاً أو متضرراً أو
  متسرباً أو غير مناسب.

### `PARAPULPAL_PIN` — Parapulpal pin

- Category: Restorative · Restaurateur / restauratrice · ترميمي
- Target: Tooth · Dent · سن
- Français: Broche parapulpaire
- العربية: دبوس مجاور للّب
- Meaning: A small retentive pin placed in dentine near the pulp to help retain
  a restorative build-up when additional support is needed.
- Signification en français: Petite broche de rétention placée dans la dentine,
  à proximité de la pulpe, pour renforcer la rétention d'une reconstruction.
- المعنى بالعربية: دبوس صغير للتثبيت يوضع في العاج بالقرب من اللب للمساعدة في
  تثبيت إعادة بناء السن عند الحاجة إلى دعم إضافي.

## Endodontic acts

### `ROOT_CANAL_MEDICATION` — Root canal medication

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Médication canalaire
- العربية: دواء داخل قناة الجذر
- Meaning: Placement of an intracanal medication as part of root-canal
  treatment, often between appointments.
- Signification en français: Mise en place d'un médicament dans le canal
  radiculaire, souvent entre deux séances de traitement endodontique.
- المعنى بالعربية: وضع دواء داخل قناة الجذر كجزء من علاج الجذور، وغالباً بين
  جلستين.

### `ROOT_CANAL_FILLING` — Root canal filling

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Obturation canalaire / obturation des canaux radiculaires
- العربية: حشو قناة الجذر
- Meaning: Sealing the prepared root-canal space with an obturation material
  after cleaning and shaping.
- Signification en français: Scellement de l'espace canalaire préparé avec un
  matériau d'obturation après son nettoyage et sa mise en forme.
- المعنى بالعربية: إغلاق القناة الجذرية المحضّرة بمادة حشو بعد تنظيفها وتشكيلها.

### `ROOT_CANAL_REPAIR` — Incomplete root canal correction

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Correction d'un traitement canalaire incomplet
- العربية: تصحيح علاج جذور غير مكتمل
- Meaning: Additional endodontic treatment intended to correct or complete a
  previous root-canal treatment.
- Signification en français: Traitement endodontique complémentaire visant à
  corriger ou terminer un traitement canalaire antérieur.
- المعنى بالعربية: علاج جذور إضافي يهدف إلى تصحيح أو إكمال علاج سابق غير مكتمل.

### `GLASS_FIBER_POST` — Glass fiber post

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Tenon en fibre de verre
- العربية: وتد من الألياف الزجاجية
- Meaning: A glass-fiber post placed in a treated root canal to help retain a
  core or coronal restoration.
- Signification en français: Tenon en fibre de verre placé dans un canal traité
  pour améliorer la rétention de la reconstitution coronaire.
- المعنى بالعربية: وتد من الألياف الزجاجية يوضع داخل قناة جذر معالجة للمساعدة في
  تثبيت بناء السن أو الترميم التاجي.

### `METAL_POST` — Metal post

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Tenon métallique
- العربية: وتد معدني
- Meaning: A metal post placed in a treated root canal to support retention of
  a coronal build-up or restoration.
- Signification en français: Tenon métallique placé dans un canal traité pour
  soutenir la rétention d'une reconstitution ou d'une restauration coronaire.
- المعنى بالعربية: وتد معدني يوضع داخل قناة جذر معالجة لدعم تثبيت إعادة بناء السن
  أو الترميم التاجي.

### `APICOECTOMY` — Apicoectomy / root resection

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Apicectomie / résection apicale
- العربية: استئصال ذروة الجذر
- Meaning: Surgical removal of the infected or diseased root tip, usually with
  treatment of the apical area.
- Signification en français: Ablation chirurgicale de l'extrémité infectée ou
  malade de la racine, généralement avec traitement de la région apicale.
- المعنى بالعربية: إزالة جراحية لطرف الجذر المصاب أو المريض، عادةً مع معالجة
  المنطقة المحيطة بالذروة.

## Surgical acts

### `EXTRACTION` — Extraction

- Category: Surgery · Chirurgie orale · جراحة الفم والأسنان
- Target: Tooth · Dent · سن
- Français: Extraction dentaire
- العربية: قلع السن
- Meaning: Removal of a tooth from its socket.
- Signification en français: Retrait d'une dent de son alvéole.
- المعنى بالعربية: إزالة السن من حُفرته العظمية.

## Implant acts

### `IMPLANT_PLACEMENT` — Implant placement

- Category: Implant · Implantologie · زراعة الأسنان
- Target: Tooth · Dent · سن
- Français: Pose d'un implant dentaire
- العربية: وضع غرسة سنية
- Meaning: Surgical placement of a dental implant fixture in the jaw to replace
  the root portion of a missing tooth.
- Signification en français: Mise en place chirurgicale d'un implant dentaire
  dans l'os maxillaire ou mandibulaire pour remplacer la partie radiculaire d'une
  dent absente.
- المعنى بالعربية: وضع غرسة سنية جراحياً في عظم الفك لتعويض الجزء الجذري للسن
  المفقود.

### `HEALING_ABUTMENT` — Healing abutment

- Category: Implant · Implantologie · زراعة الأسنان
- Target: Tooth · Dent · سن
- Français: Pilier de cicatrisation
- العربية: دعامة الالتئام
- Meaning: An implant component that shapes and supports the soft tissue during
  healing before the definitive restoration.
- Signification en français: Composant implantaire qui façonne et soutient les
  tissus mous pendant la cicatrisation avant la restauration définitive.
- المعنى بالعربية: مكوّن من مكونات الغرسة يشكل الأنسجة الرخوة ويدعمها أثناء
  الالتئام قبل وضع الترميم النهائي.

## Prosthodontic acts

### `BRIDGE` — Fixed bridge

- Category: Prosthodontic · Prothétique · تعويضات سنية
- Target: Bridge span · Étendue du bridge · امتداد الجسر
- Français: Bridge fixe / pont fixe
- العربية: جسر سني ثابت
- Meaning: A fixed prosthesis that replaces one or more missing teeth and is
  supported by adjacent teeth or implants.
- Signification en français: Prothèse fixe remplaçant une ou plusieurs dents
  absentes et reposant sur des dents ou des implants voisins.
- المعنى بالعربية: تعويض ثابت يستبدل سناً أو عدة أسنان مفقودة ويستند إلى أسنان
  مجاورة أو إلى غرسات.

### `LOCATOR_ATTACHMENT` — Locator attachment

- Category: Prosthodontic · Prothétique · تعويضات سنية
- Target: Tooth · Dent · سن
- Français: Attachement Locator
- العربية: ملحق لوكاتور
- Meaning: A low-profile attachment that connects a removable overdenture to an
  implant or implant-supported component.
- Signification en français: Attachement de faible hauteur reliant une prothèse
  amovible supra-implantaire à un implant ou à un composant implantaire.
- المعنى بالعربية: ملحق منخفض الارتفاع يربط الطقم المتحرك فوق الغرسات بغرسة أو
  بمكوّن مدعوم بالغرسة.

### `LOCATOR_OVERDENTURE` — Locator overdenture

- Category: Prosthodontic · Prothétique · تعويضات سنية
- Target: Arch · Arcade dentaire · قوس سني
- Français: Prothèse amovible supra-implantaire stabilisée par Locator
- العربية: طقم فوقي متحرك مثبت بملحقات لوكاتور
- Meaning: A removable denture stabilized by Locator attachments connected to
  implants.
- Signification en français: Prothèse amovible stabilisée par des attachements
  Locator reliés à des implants.
- المعنى بالعربية: طقم أسنان متحرك تثبته ملحقات لوكاتور المرتبطة بالغرسات.

### `BAR_ATTACHMENT` — Bar attachment

- Category: Prosthodontic · Prothétique · تعويضات سنية
- Target: Tooth · Dent · سن
- Français: Attachement par barre
- العربية: ملحق بواسطة قضيب
- Meaning: A bar-based connector used to retain or stabilize a removable
  prosthesis.
- Signification en français: Système de connexion utilisant une barre pour
  retenir ou stabiliser une prothèse amovible.
- المعنى بالعربية: نظام اتصال يستخدم قضيباً لتثبيت أو دعم تعويض سني متحرك.

### `BAR_OVERDENTURE` — Bar overdenture

- Category: Prosthodontic · Prothétique · تعويضات سنية
- Target: Arch · Arcade dentaire · قوس سني
- Français: Prothèse amovible supra-implantaire stabilisée par barre
- العربية: طقم فوقي متحرك مثبت بواسطة قضيب
- Meaning: A removable overdenture retained and stabilized by a bar connected
  to implants or supporting components.
- Signification en français: Prothèse amovible supra-implantaire retenue et
  stabilisée par une barre reliée à des implants ou à des éléments porteurs.
- المعنى بالعربية: طقم متحرك فوقي يثبت ويدعم بواسطة قضيب متصل بغرسات أو بمكونات
  داعمة.

### `PARTIAL_REMOVABLE_DENTURE` — Partial removable denture

- Category: Prosthodontic · Prothétique · تعويضات سنية
- Target: Arch · Arcade dentaire · قوس سني
- Français: Prothèse partielle amovible
- العربية: طقم أسنان جزئي متحرك
- Meaning: A removable prosthesis that replaces some missing teeth while
  retaining remaining natural teeth.
- Signification en français: Prothèse amovible remplaçant certaines dents
  absentes tout en s'appuyant sur les dents naturelles restantes.
- المعنى بالعربية: تعويض متحرك يستبدل بعض الأسنان المفقودة مع الاستفادة من الأسنان
  الطبيعية المتبقية للدعم.

### `COMPLETE_REMOVABLE_DENTURE` — Complete removable denture

- Category: Prosthodontic · Prothétique · تعويضات سنية
- Target: Arch · Arcade dentaire · قوس سني
- Français: Prothèse complète amovible
- العربية: طقم أسنان كامل متحرك
- Meaning: A removable prosthesis that replaces all teeth in one dental arch.
- Signification en français: Prothèse amovible remplaçant toutes les dents d'une
  arcade dentaire.
- المعنى بالعربية: تعويض متحرك يستبدل جميع أسنان أحد القوسين السنيين.

## Orthodontic acts

### `ORTHODONTIC_APPLIANCE` — Orthodontic appliance

- Category: Orthodontic · Orthodontique · تقويمي
- Target: Tooth · Dent · سن
- Français: Appareil orthodontique
- العربية: جهاز تقويمي
- Meaning: An orthodontic component recorded for tooth movement or alignment,
  including a bracket or band in the current catalogue.
- Signification en français: Composant orthodontique enregistré pour déplacer ou
  aligner une dent, notamment un bracket ou une bague dans le catalogue actuel.
- المعنى بالعربية: مكوّن تقويمي يُسجّل لتحريك السن أو تصحيح اصطفافه، مثل الحاصرة
  أو الحلقة في الكتالوج الحالي.

# Clinical findings

Clinical findings describe what is observed, diagnosed, or measured. They are
not treatment acts and should not be interpreted as completed procedures.

## Status findings

### `TOOTH_STATE` — Tooth state

- Category: Status · État · الحالة
- Target: Tooth · Dent · سن
- Français: État de la dent
- العربية: حالة السن
- Meaning: Records whether the tooth is natural, missing, an implant, primary,
  unerupted, or missing after an extraction or closed space.
- Signification en français: Décrit si la dent est naturelle, absente, remplacée
  par un implant, temporaire, sous la gencive, extraite ou si l'espace est fermé.
- المعنى بالعربية: يصف ما إذا كان السن طبيعياً أو مفقوداً أو غرسة أو سنّاً لبنياً
  أو تحت اللثة أو مفقوداً بعد القلع أو أن الفراغ قد أُغلق.

### `TOOTH_SUBSTRATE` — Tooth substrate

- Category: Status · État · الحالة
- Target: Tooth · Dent · سن
- Français: Substrat dentaire / état de la structure dentaire
- العربية: بنية السن أو مادته المتبقية
- Meaning: Describes the remaining tooth structure, such as a natural tooth,
  root remnant, broken tooth, or crown preparation.
- Signification en français: Décrit la structure dentaire restante, par exemple
  une dent naturelle, un reste radiculaire, une dent fracturée ou une
  préparation coronaire.
- المعنى بالعربية: يصف بنية السن المتبقية، مثل سن طبيعي أو بقايا جذر أو سن مكسور
  أو سن محضّر للتاج.

## Caries and restoration findings

### `CARIES` — Dental caries

- Category: Caries & restorations · Caries et restaurations · التسوس والترميمات
- Target: Surface · Surface dentaire · سطح السن
- Français: Carie dentaire
- العربية: تسوس الأسنان
- Meaning: A carious lesion caused by demineralization and destruction of tooth
  tissues; the catalogue also records severity and radiographic depth.
- Signification en français: Lésion carieuse due à la déminéralisation et à la
  destruction des tissus dentaires; le catalogue peut aussi enregistrer la
  sévérité et la profondeur radiographique.
- المعنى بالعربية: آفة ناتجة عن نزع المعادن وتخرب أنسجة السن؛ ويمكن للكتالوج أيضاً
  تسجيل شدتها وعمقها الشعاعي.

### `ROOT_CARIES` — Root caries

- Category: Caries & restorations · Caries et restaurations · التسوس والترميمات
- Target: Tooth · Dent · سن
- Français: Carie radiculaire
- العربية: تسوس الجذر
- Meaning: Caries affecting exposed root surfaces, recorded as active, arrested,
  or active and cavitated.
- Signification en français: Carie touchant une surface radiculaire exposée,
  enregistrée comme active, arrêtée, ou active et cavitée.
- المعنى بالعربية: تسوس يصيب أسطح الجذر المكشوفة، ويُسجّل على أنه نشط أو متوقف
  أو نشط مع وجود حفرة.

### `EXISTING_FILLING` — Existing filling

- Category: Caries & restorations · Caries et restaurations · التسوس والترميمات
- Target: Surface · Surface dentaire · سطح السن
- Français: Obturation existante / plombage existant
- العربية: حشوة موجودة
- Meaning: Records a filling already present on the tooth, including its
  material and any documented marginal defect, fracture, or wear.
- Signification en français: Enregistre une obturation déjà présente, avec son
  matériau et un éventuel défaut marginal, une fracture ou une usure.
- المعنى بالعربية: يسجل حشوة موجودة مسبقاً، مع مادتها وأي خلل هامشي أو كسر أو
  تآكل موثق.

### `EXISTING_FIXED_RESTORATION` — Existing fixed restoration

- Category: Caries & restorations · Caries et restaurations · التسوس والترميمات
- Target: Tooth · Dent · سن
- Français: Restauration fixe existante
- العربية: ترميم ثابت موجود
- Meaning: Records an existing crown, inlay, onlay, veneer, or bridge on the
  tooth.
- Signification en français: Enregistre une couronne, un inlay, un onlay, une
  facette ou un bridge déjà présent.
- المعنى بالعربية: يسجل تاجاً أو إنلاي أو أونلاي أو قشرة أو جسراً موجوداً مسبقاً.

### `CROWN_LEAKAGE` — Crown marginal leakage

- Category: Caries & restorations · Caries et restaurations · التسوس والترميمات
- Target: Tooth · Dent · سن
- Français: Fuite marginale de couronne
- العربية: تسرب هامشي حول التاج
- Meaning: Records a suspected or observed gap or leakage at the margin where an
  existing crown meets the tooth.
- Signification en français: Signale un espace ou une fuite suspectée ou observée
  au niveau de la limite entre une couronne existante et la dent.
- المعنى بالعربية: يسجل وجود فجوة أو تسرب مشتبه به أو ملاحظ عند الحافة التي يلتقي
  فيها التاج الموجود بالسن.

## Endodontic findings

### `EXISTING_ENDODONTIC_STATE` — Existing endodontic treatment

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Traitement endodontique existant
- العربية: علاج جذور موجود
- Meaning: Records the current state of previous endodontic work, such as
  medication, root-canal filling, incomplete filling, or a post.
- Signification en français: Décrit l'état d'un traitement endodontique antérieur,
  notamment une médication, une obturation canalaire incomplète ou un tenon.
- المعنى بالعربية: يصف حالة علاج جذور سابق، مثل وجود دواء أو حشو قناة أو حشو غير
  مكتمل أو وتد.

### `PULP_DIAGNOSIS` — Pulp diagnosis

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Diagnostic pulpaire
- العربية: تشخيص لب السن
- Meaning: Records the clinical diagnosis of the dental pulp, such as normal pulp,
  reversible or irreversible pulpitis, or necrosis.
- Signification en français: Enregistre le diagnostic clinique de la pulpe,
  notamment pulpe normale, pulpite réversible ou irréversible, ou nécrose.
- المعنى بالعربية: يسجل التشخيص السريري للب السن، مثل لب طبيعي أو التهاب لب قابل
  للعكس أو غير قابل للعكس أو نخر اللب.

### `APICAL_DIAGNOSIS` — Apical diagnosis

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Diagnostic apical
- العربية: التشخيص الذروي
- Meaning: Records the diagnosis of tissues around the root tip, including
  symptomatic or asymptomatic apical periodontitis, abscess, or condensing
  osteitis.
- Signification en français: Enregistre le diagnostic des tissus autour de
  l'apex, notamment une parodontite apicale symptomatique ou asymptomatique, un
  abcès ou une ostéite condensante.
- المعنى بالعربية: يسجل تشخيص الأنسجة المحيطة بذروة الجذر، مثل التهاب دواعم السن
  الذروي العرضي أو غير العرضي أو الخراج أو التهاب العظم المتصلب.

### `PERIAPICAL_LESION` — Periapical lesion

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Lésion périapicale
- العربية: آفة حول ذروية
- Meaning: Records a lesion around the root tip, classified in the catalogue as
  granuloma, cyst, or abscess.
- Signification en français: Enregistre une lésion autour de l'apex, classée dans
  le catalogue comme granulome, kyste ou abcès.
- المعنى بالعربية: يسجل آفة حول ذروة الجذر، ويصنفها الكتالوج كحبيبوم أو كيسة أو
  خراج.

### `ROOT_RESORPTION` — Root resorption

- Category: Endodontic · Endodontique · علاج جذور الأسنان
- Target: Tooth · Dent · سن
- Français: Résorption radiculaire
- العربية: امتصاص الجذر
- Meaning: Records loss of root structure, with the current catalogue
  distinguishing internal and external cervical resorption.
- Signification en français: Enregistre une perte de structure radiculaire, le
  catalogue distinguant la résorption interne et la résorption cervicale externe.
- المعنى بالعربية: يسجل فقداناً في بنية الجذر، مع تمييز الكتالوج بين الامتصاص
  الداخلي والامتصاص العنقي الخارجي.

## Periodontal findings

### `CALCULUS` — Calculus

- Category: Periodontal · Parodontal · دواعم السن واللثة
- Target: Tooth · Dent · سن
- Français: Tartre / calculus dentaire
- العربية: جير الأسنان
- Meaning: Records mineralized dental plaque deposited on the tooth surface.
- Signification en français: Enregistre une plaque dentaire minéralisée déposée
  sur la surface de la dent.
- المعنى بالعربية: يسجل اللويحة السنية المتكلسة المترسبة على سطح السن.

### `MOBILITY` — Mobility

- Category: Periodontal · Parodontal · دواعم السن واللثة
- Target: Tooth · Dent · سن
- Français: Mobilité dentaire
- العربية: حركة السن أو تخلخل السن
- Meaning: Records abnormal movement of a tooth, with grades I, II, or III in
  the catalogue.
- Signification en français: Enregistre un mouvement anormal de la dent, classé
  en grades I, II ou III dans le catalogue.
- المعنى بالعربية: يسجل حركة غير طبيعية للسن، مصنفة في الكتالوج إلى درجات أولى
  أو ثانية أو ثالثة.

### `PERIODONTAL_INVOLVEMENT` — Periodontal involvement

- Category: Periodontal · Parodontal · دواعم السن واللثة
- Target: Tooth · Dent · سن
- Français: Atteinte parodontale
- العربية: إصابة دواعم السن
- Meaning: Records that the tooth is affected by a periodontal condition or
  periodontal-support involvement.
- Signification en français: Signale une atteinte parodontale ou une implication
  des tissus de soutien de la dent.
- المعنى بالعربية: يسجل تأثر السن بحالة حول سنية أو بتأثر الأنسجة الداعمة له.

### `PERIODONTAL_MEASUREMENT` — Periodontal probing

- Category: Periodontal · Parodontal · دواعم السن واللثة
- Target: Periodontal site · Site parodontal · موقع حول سني
- Français: Sondage parodontal / mesure de profondeur de poche
- العربية: جس دواعم السن / قياس عمق الجيب اللثوي
- Meaning: Records a periodontal probing measurement at a defined site, in
  millimetres in the current catalogue.
- Signification en français: Enregistre une mesure de sondage parodontal sur un
  site défini, en millimètres dans le catalogue actuel.
- المعنى بالعربية: يسجل قياس الجس حول السني في موقع محدد، بالمليمتر في الكتالوج
  الحالي.

### `FURCATION_INVOLVEMENT` — Furcation involvement

- Category: Periodontal · Parodontal · دواعم السن واللثة
- Target: Tooth · Dent · سن
- Français: Atteinte de la furcation
- العربية: إصابة منطقة تفرع الجذور
- Meaning: Records loss or involvement of supporting tissues in the furcation of
  a multirooted tooth, using grades I through IV.
- Signification en français: Enregistre une atteinte des tissus de soutien dans
  la furcation d'une dent pluriradiculée, avec des grades I à IV.
- المعنى بالعربية: يسجل تأثر الأنسجة الداعمة في منطقة تفرع جذور السن متعدد الجذور،
  بدرجات من الأولى إلى الرابعة.

### `PLAQUE_FINDING` — Plaque

- Category: Periodontal · Parodontal · دواعم السن واللثة
- Target: Surface · Surface dentaire · سطح السن
- Français: Plaque dentaire
- العربية: اللويحة السنية
- Meaning: Records visible or detected bacterial plaque on a tooth surface.
- Signification en français: Enregistre la présence visible ou détectée de plaque
  bactérienne sur une surface dentaire.
- المعنى بالعربية: يسجل وجود اللويحة البكتيرية المرئية أو المكتشفة على سطح السن.

### `GINGIVAL_FINDING` — Gingival finding

- Category: Periodontal · Parodontal · دواعم السن واللثة
- Target: Surface · Surface dentaire · سطح السن
- Français: Observation gingivale
- العربية: ملاحظة لثوية
- Meaning: Records a gingival observation associated with a tooth surface.
- Signification en français: Enregistre une observation concernant la gencive
  associée à une surface dentaire.
- المعنى بالعربية: يسجل ملاحظة متعلقة باللثة المرتبطة بسطح من أسطح السن.

## Other findings

### `EXISTING_PROSTHESIS` — Existing prosthesis / attachment

- Category: Other · Autre · أخرى
- Target: Tooth · Dent · سن
- Français: Prothèse ou attachement existant
- العربية: تعويض سني أو ملحق موجود
- Meaning: Records an existing prosthetic component or attachment, including a
  healing abutment, Locator, bar, partial denture, or complete denture.
- Signification en français: Enregistre un élément prothétique ou un attachement
  existant, notamment un pilier de cicatrisation, un Locator, une barre ou une
  prothèse partielle ou complète.
- المعنى بالعربية: يسجل مكوّناً تعويضياً أو ملحقاً موجوداً، مثل دعامة الالتئام
  أو لوكاتور أو قضيب أو طقم جزئي أو كامل.

### `CONTACT_POINT_DEFECT` — Contact point defect

- Category: Other · Autre · أخرى
- Target: Surface · Surface dentaire · سطح السن
- Français: Défaut du point de contact
- العربية: خلل نقطة التماس
- Meaning: Records an abnormal or deficient contact area between adjacent teeth.
- Signification en français: Enregistre une zone de contact anormale ou
  insuffisante entre deux dents adjacentes.
- المعنى بالعربية: يسجل خللاً أو نقصاً في منطقة التماس بين سنين متجاورين.

### `TOOTH_FRACTURE` — Tooth fracture

- Category: Other · Autre · أخرى
- Target: Tooth region · Région de la dent · منطقة من السن
- Français: Fracture dentaire
- العربية: كسر السن
- Meaning: Records a fracture affecting a defined region of the tooth.
- Signification en français: Enregistre une fracture touchant une région définie
  de la dent.
- المعنى بالعربية: يسجل كسراً يصيب منطقة محددة من السن.

### `EXTRACTION_WOUND` — Extraction wound

- Category: Other · Autre · أخرى
- Target: Tooth · Dent · سن
- Français: Plaie d'extraction
- العربية: جرح القلع
- Meaning: Records the healing wound or socket after a tooth extraction.
- Signification en français: Enregistre la plaie ou l'alvéole en cours de
  cicatrisation après une extraction dentaire.
- المعنى بالعربية: يسجل الجرح أو الحفرة العظمية أثناء الالتئام بعد قلع السن.

### `TOOTH_WEAR` — Tooth wear

- Category: Other · Autre · أخرى
- Target: Surface · Surface dentaire · سطح السن
- Français: Usure dentaire
- العربية: تآكل الأسنان
- Meaning: Records loss of tooth structure from processes such as attrition,
  abrasion, abfraction, or erosion.
- Signification en français: Enregistre une perte de structure dentaire liée à
  des phénomènes tels que l'attrition, l'abrasion, l'abfraction ou l'érosion.
- المعنى بالعربية: يسجل فقداناً في بنية السن بسبب عوامل مثل السحل أو السحج أو
  الانحسار الإسفيني أو التآكل الكيميائي.

### `DISCOLORATION` — Discoloration

- Category: Other · Autre · أخرى
- Target: Tooth · Dent · سن
- Français: Dyschromie / changement de couleur
- العربية: تغير لون السن
- Meaning: Records an abnormal tooth colour and its selected cause or pattern,
  such as tetracycline, fluorosis, non-vital, or extrinsic discoloration.
- Signification en français: Enregistre une coloration anormale de la dent et
  son origine ou son aspect sélectionné, par exemple tétracycline, fluorose,
  dent non vitale ou coloration extrinsèque.
- المعنى بالعربية: يسجل تغيراً غير طبيعي في لون السن وسببه أو نمطه المختار، مثل
  التتراسيكلين أو الفلوروز أو السن غير الحيوي أو التصبغ الخارجي.

### `ORTHODONTIC_STATE` — Orthodontic state

- Category: Other · Autre · أخرى
- Target: Tooth · Dent · سن
- Français: État orthodontique
- العربية: الحالة التقويمية
- Meaning: Records an orthodontic component or tooth movement state, such as a
  bracket, band, mesial drift, distal drift, extrusion, intrusion, or rotation.
- Signification en français: Enregistre un élément orthodontique ou une position
  de la dent, notamment bracket, bague, migration mésiale ou distale, extrusion,
  intrusion ou rotation.
- المعنى بالعربية: يسجل مكوّناً تقويمياً أو حالة حركة السن، مثل الحاصرة أو الحلقة
  أو الانجراف الأنسي أو الوحشي أو البزوغ الزائد أو الانغراز أو الدوران.

### `PERI_IMPLANT_STATUS` — Peri-implant status

- Category: Other · Autre · أخرى
- Target: Tooth · Dent · سن
- Français: État péri-implantaire
- العربية: حالة الأنسجة حول الغرسة
- Meaning: Records the tissue status around a dental implant, from healthy to
  mucositis or mild, moderate, or severe peri-implantitis.
- Signification en français: Enregistre l'état des tissus autour d'un implant,
  de la santé à la mucosite ou à la péri-implantite légère, modérée ou sévère.
- المعنى بالعربية: يسجل حالة الأنسجة المحيطة بالغرسة، من الحالة السليمة إلى
  التهاب مخاطية ما حول الغرسة أو التهاب ما حول الغرسة بدرجاته المختلفة.

## Catalogue detail values

Several catalogue entries collect additional structured values, such as:

- restoration and filling materials;
- crown, inlay, onlay, veneer, or bridge type;
- orthodontic bracket or band;
- caries severity and radiographic depth;
- pulp and apical diagnosis;
- root-caries activity;
- mobility and furcation grades;
- periodontal probing depth; and
- wear, discoloration, prosthesis, and peri-implant subtypes.

These values are intentionally kept as structured details on the record rather
than separate top-level act or finding codes. The exact supported values remain
defined by `treatment-catalogue.ts` and `clinical-detail-options.ts`.

## Governance notes

- Do not use translated labels as API identifiers; use the stable catalogue
  codes such as `DIRECT_FILLING` or `PULP_DIAGNOSIS`.
- Do not treat a clinical finding as proof that a treatment is required.
- Do not treat a treatment act as proof that treatment was completed; its
  lifecycle status must be checked.
- French and Arabic terminology should be reviewed by Clinora's clinical owner
  before being exposed as legally authoritative medical or billing text.
- If a clinic needs regional Arabic terminology, add locale-specific display
  labels while retaining the same catalogue code.
