-- CHAYTHRAAR Encyclopedia reviewed seed data
--
-- This file contains reviewed source-backed encyclopedia entries for CHAYTHRAAR.
-- Image assignments are managed manually through the admin image library.

update public.encyclopedia
set category = 'Music'
where lower(title) = 'chitrali sitar';

update public.encyclopedia
set category = 'Music'
where lower(title) = 'surnai in khowar music';

update public.encyclopedia
set category = 'Music'
where lower(title) = 'al-fatah music group';

update public.encyclopedia
set category = 'Music'
where lower(title) = 'pasture flute in khowar music';

update public.encyclopedia
set category = 'Music',
    content = 'The Pakistan State Party''s UNESCO Tentative List entry for the Kalasha Valley Cultural Landscape describes festival music and dance as part of Kalasha intangible heritage and identifies Palawjaw in Bumburet as a place for communal festival dances. This entry is specifically about Kalasha practice; the source does not establish a single choreography or a dhol accompaniment.'
where lower(title) = lower('Kalasha Festival Dance')
  and category <> 'Music';

update public.encyclopedia
set category = 'Music'
where lower(title) = any(array[
    'ziarat khan zeerak',
    'ziyarat khan zeerak',
    'ziarat khan zirak',
    'ziyarat khan zirak',
    'sonoghro malang'
  ])
  and lower(category) = 'poets';

update public.encyclopedia
set category = 'Music'
where lower(title) = any(array[
    'iqbal uddin sahar',
    'iqbaluddin sahar',
    'afzal ullah afzal',
    'afzalullah afzal',
    'ali aman khan',
    'baba siyar (mirza muhammad siyar)'
  ])
  and lower(category) = 'poets';

insert into public.encyclopedia (
  title,
  category,
  content,
  image_url,
  source,
  source_url
) values
  (
    'Chitral Valley',
    'Geography',
    'Chitral lies in the Hindu Kush of north-western Pakistan and forms a long mountain valley system connected to Afghanistan and Gilgit-Baltistan by high passes. The valley is characterized by rugged mountains, river systems, glaciers, alpine areas and a pronounced cultural and linguistic diversity.',
    NULL,
    'Government of Pakistan tourism material; Encyclopaedia Iranica',
    'https://tourism.gov.pk/publications/Chitral.pdf?utm_source=chatgpt.com'
  ),
  (
    'Lower and Upper Chitral',
    'Geography',
    'The former Chitral District is now administratively divided into Lower Chitral and Upper Chitral. Pakistan''s 2023 census reports them as separate districts, with separate local administrative and population statistics.',
    NULL,
    'Pakistan Bureau of Statistics',
    'https://www.pbs.gov.pk/sites/default/files/population/2023/tables/table_31_kp_districts.pdf?utm_source=chatgpt.com'
  ),
  (
    'Chitral River',
    'Geography',
    'The Chitral River drains the eastern Hindu Kush. In Afghanistan the river is known as the Kunar and eventually joins the Kabul River. Mountain snow and glacier melt are major components of the river system and are particularly important for irrigation in Chitral.',
    NULL,
    'Encyclopaedia Iranica',
    'https://www.iranicaonline.org/articles/chitral-i-geography/?utm_source=chatgpt.com'
  ),
  (
    'Hindu Kush in Chitral',
    'Geography',
    'The Hindu Kush is the dominant mountain system of Chitral. The eastern Hindu Kush contains several peaks above 7,000 metres, with Tirich Mir forming its highest point.',
    NULL,
    'Encyclopaedia Iranica',
    'https://www.iranicaonline.org/articles/hindu-kush/?utm_source=chatgpt.com'
  ),
  (
    'Tirich Mir',
    'Geography',
    'Tirich Mir rises to about 7,706–7,708 metres and is the highest mountain in the Hindu Kush. It dominates the northern Chitral landscape and is one of the region''s defining geographic landmarks.',
    NULL,
    'Encyclopaedia Iranica',
    'https://www.iranicaonline.org/articles/chitral-i-geography/?utm_source=chatgpt.com'
  ),
  (
    'Chitral Bashkar Garmchashm Biosphere Reserve',
    'Environment',
    'UNESCO''s Chitral Bashkar Garmchashm Biosphere Reserve covers a large Hindu Kush landscape containing glaciers, alpine pastures, deep valleys and high-mountain ecosystems. UNESCO identifies conservation, sustainable development, ecotourism, environmental education and biodiversity research as key objectives.',
    NULL,
    'UNESCO MAB',
    'https://www.unesco.org/en/mab/chitral-bashkar-garmchashm?utm_source=chatgpt.com'
  ),
  (
    'Chitral Gol National Park',
    'Environment',
    'Chitral Gol is a protected mountain landscape immediately west of Chitral town. Historical IUCN material records its declaration as a national park in 1984 and describes a narrow valley, tributary streams, high peaks and dry-temperate conditions. The park is important habitat for mountain wildlife including markhor.',
    NULL,
    'IUCN; ICIMOD research',
    'https://portals.iucn.org/library/sites/library/files/documents/1990-Green-001-En.pdf?utm_source=chatgpt.com'
  ),
  (
    'Broghil National Park',
    'Environment',
    'Broghil National Park was established in 2010 in the northern part of Chitral. It encompasses the Broghil Valley and part of the Yarkhun Valley, with high-altitude grasslands, peatlands, lakes and mountains above 3,000 metres. Its location also connects with the Indus flyway for migratory birds.',
    NULL,
    'ICIMOD',
    'https://www.icimod.org/wp-content/uploads/2019/12/Broghil-National-Park.pdf?utm_source=chatgpt.com'
  ),
  (
    'Shandur Pass',
    'Geography',
    'Shandur is a high mountain pass connecting Upper Chitral with Gilgit-Baltistan. The pass sits at roughly 3,700–3,800 metres and is famous for its natural polo ground and summer festival. Access is seasonal and winter snowfall can close the route.',
    NULL,
    'Government of KP; GB Tourism Department',
    'https://dgipr.kp.gov.pk/mark-your-calendars-for-an-unforgettable-journey-to-the-worlds-highest-polo-ground-as-the-shandur-polo-festival-returns-from-june-11-13-2026/?utm_source=chatgpt.com'
  ),
  (
    'Lowari Pass and Lowari Tunnel',
    'Geography',
    'Lowari is a historic mountain route connecting Chitral with the Dir side of the Hindu Kush. The pass itself is affected by heavy winter snow; the Lowari Tunnel provides a more reliable road connection through the mountains.',
    NULL,
    'Government of Pakistan tourism material; Encyclopaedia Iranica',
    'https://tourism.gov.pk/publications/Chitral.pdf?utm_source=chatgpt.com'
  ),
  (
    'Golen Gol',
    'Infrastructure',
    'Golen Gol is a major valley and water system in Chitral. The Golen Gol Hydropower Project is located on the Golen Gol River, a tributary of the Mastuj River, and has an installed capacity of 108 MW according to WAPDA.',
    NULL,
    'WAPDA; Ministry of Water Resources',
    'https://wapda.gov.pk/golen-gol-hydropower/?utm_source=chatgpt.com'
  ),
  (
    'Goleen Valley',
    'Geography',
    'Goleen is a valley north-east of Chitral town known for its mountain scenery, mixed local culture and access to trekking areas. Government tourism material identifies attractions including Chattodok Lake and routes toward Laspur, Madaklasht and Koghozi.',
    NULL,
    'Government of Pakistan tourism guide',
    'https://tourism.gov.pk/publications/Chitral.pdf?utm_source=chatgpt.com'
  ),
  (
    'Madaklasht Valley',
    'Geography',
    'Madaklasht is a mountain valley near the southern entrance to Chitral. Government and Associated Press material describe its potential for ecotourism, adventure activities and winter sports, while its surrounding landscape includes forests and high mountain terrain.',
    NULL,
    'KP Board of Investment; APP',
    'https://kpboit.gov.pk/tourism/?utm_source=chatgpt.com'
  ),
  (
    'Kalasha Valley Cultural Landscape',
    'Culture',
    'The Kalasha Cultural Landscape consists of Bumburet, Rumbur and Birir. UNESCO''s 2026 Tentative List submission describes it as a living high-mountain cultural landscape where settlements, agriculture, sacred places, forests, grazing areas and ritual traditions remain interconnected. The submission documents 143 cultural sites.',
    NULL,
    'UNESCO World Heritage Centre',
    'https://whc.unesco.org/en/tentativelists/6965/?utm_source=chatgpt.com'
  ),
  (
    'Kalasha People',
    'Culture',
    'The Kalasha are an indigenous community living principally in the three Kalasha valleys of Lower Chitral. Their distinct language, religious traditions, festivals, clothing, settlement patterns and relationship with the surrounding landscape form an important part of Chitral''s cultural diversity.',
    NULL,
    'UNESCO; Government of KP',
    'https://whc.unesco.org/en/tentativelists/6965/?utm_source=chatgpt.com'
  ),
  (
    'Bumburet Valley',
    'Culture',
    'Bumburet is one of the three principal Kalasha valleys and is included in the UNESCO Tentative List cultural landscape. Its cultural geography includes villages, sacred places, agricultural land, forests and ceremonial spaces.',
    NULL,
    'UNESCO World Heritage Centre',
    'https://whc.unesco.org/en/tentativelists/6965/?utm_source=chatgpt.com'
  ),
  (
    'Rumbur Valley',
    'Culture',
    'Rumbur is one of the three Kalasha valleys. UNESCO identifies it as part of the continuously inhabited Kalasha cultural landscape, where ritual sites, agricultural areas, forests and settlements remain interconnected.',
    NULL,
    'UNESCO World Heritage Centre',
    'https://whc.unesco.org/en/tentativelists/6965/?utm_source=chatgpt.com'
  ),
  (
    'Birir Valley',
    'Culture',
    'Birir is the third principal Kalasha valley. It forms part of the UNESCO Tentative List cultural landscape and retains its own settlements, ceremonial spaces, agricultural practices and local traditions.',
    NULL,
    'UNESCO World Heritage Centre',
    'https://whc.unesco.org/en/tentativelists/6965/?utm_source=chatgpt.com'
  ),
  (
    'Suri Jagek',
    'Culture',
    'Suri Jagek is a traditional Kalasha knowledge system based on observing the sun, moon, stars, shadows and local topography. It has historically informed agriculture, seasonal activities, weather observations and the Kalasha calendar. UNESCO inscribed it in 2018 on the List of Intangible Cultural Heritage in Need of Urgent Safeguarding.',
    NULL,
    'UNESCO ICH',
    'https://ich.unesco.org/en/USL/suri-jagek-observing-the-sun-traditional-meteorological-and-astronomical-practice-based-on-the-observation-of-the-sun-moon-and-stars-in-reference-to-the-local-topography-01381?utm_source=chatgpt.com'
  ),
  (
    'Mastruk Hisab - The Kalasha Calendar',
    'Culture',
    'Mastruk Hisab is described in the Khyber Pakhtunkhwa intangible-heritage inventory as the traditional Kalasha calendar. Its calculation is linked to observations of the moon and sun, seasonal cycles and the timing of social and cultural activities.',
    NULL,
    'KP Intangible Cultural Heritage Inventory',
    'https://ichinventory.com.pk/wp-content/uploads/inv-desc/brief_description_mastruk_hisab.pdf?utm_source=chatgpt.com'
  ),
  (
    'Onjesta',
    'Culture',
    'Onjesta is a Kalasha concept concerning purity and positive states. The community inventory describes it as influencing interpretations of places, activities, agricultural practices and ritual life. It exists alongside the contrasting concept of impurity.',
    NULL,
    'KP Intangible Cultural Heritage Inventory',
    'https://ichinventory.com.pk/wp-content/uploads/inv-desc/brief_description_onjesta.pdf?utm_source=chatgpt.com'
  ),
  (
    'Pasti',
    'Culture',
    'Pasti is a traditional detached wooden storage structure used by the Kalasha and local Muslim communities to preserve food and agricultural products. The national heritage register describes its elevated construction and ventilation system as important to long-term storage.',
    NULL,
    'National Register of Intangible Cultural Heritage of Pakistan',
    'https://heritage.pakistan.gov.pk/SiteImage/Misc/files/ICH%20Pakistan%20Low.pdf?utm_source=chatgpt.com'
  ),
  (
    'Istrizhon Peran Sik',
    'Culture',
    'Istrizhon Peran Sik refers to the traditional craftsmanship associated with making Kalasha women''s Peran dress. Pakistan''s national heritage register describes changes from older wool garments toward black cloth with embroidery and decorative patterns.',
    NULL,
    'National Register of Intangible Cultural Heritage of Pakistan',
    'https://heritage.pakistan.gov.pk/SiteImage/Misc/files/ICH%20Pakistan%20Low.pdf?utm_source=chatgpt.com'
  ),
  (
    'Kalasha Sacred and Ceremonial Architecture',
    'Architecture',
    'The Kalasha cultural landscape contains structures and spaces such as Jastak Han, Bashali buildings, altars, ritual platforms, dancing grounds and sacred sites. UNESCO describes these not simply as monuments but as functioning parts of a living cultural system.',
    NULL,
    'UNESCO World Heritage Centre',
    'https://whc.unesco.org/en/tentativelists/6965/?utm_source=chatgpt.com'
  ),
  (
    'Chilam Joshi',
    'Culture',
    'Chilam Joshi is a major spring festival of the Kalasha communities. Pakistan''s Ministry of Foreign Affairs describes it as a multi-day spring celebration held across Rumbur, Bumburet and Birir, featuring communal cultural activities and attracting visitors.',
    NULL,
    'Ministry of Foreign Affairs Pakistan',
    'https://www.mofa.gov.pk/tourism-in-pakistan?utm_source=chatgpt.com'
  ),
  (
    'Uchau / Uchal',
    'Culture',
    'Uchau is a Kalasha seasonal festival associated with summer. Academic research on Kalasha festivals places it among the community''s major annual celebrations alongside Joshi and Chawmos.',
    NULL,
    'Ali & Chawla, Pakistan Vision',
    'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5369653&utm_source=chatgpt.com'
  ),
  (
    'Chawmos',
    'Culture',
    'Chawmos is the winter festival at the end of the agricultural year. Ethnographic research describes it as one of the most complex parts of the Kalasha ritual calendar, involving a sequence of communal, seasonal and religious observances.',
    NULL,
    'Ali & Chawla; UNESCO community documentation',
    'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5369653&utm_source=chatgpt.com'
  ),
  (
    'Khowar Language',
    'Language',
    'Khowar is an Indo-Aryan language of the Dardic group and the predominant language of Chitral. Linguistic research describes it as a major lingua franca in Chitral, with speakers also found in parts of Gilgit-Baltistan, Swat and Pakistani cities.',
    NULL,
    'Cambridge University Press; Encyclopaedia Iranica',
    'https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/khowar/A5CF61AA6FB9D04363792EBE8B7BA89A?utm_source=chatgpt.com'
  ),
  (
    'Khowar Writing and Grammar',
    'Language',
    'Modern written Khowar has been documented through grammatical works, dictionaries and linguistic research. A major open-access descriptive grammar is based on fieldwork in Chitral conducted over several decades, demonstrating the depth of linguistic research available for the language.',
    NULL,
    'JSTOR; Cambridge University Press',
    'https://www.jstor.org/content/oa_book_monograph/jj.19724090?utm_source=chatgpt.com'
  ),
  (
    'Shandur Mela / Shandur Polo Festival',
    'Sport',
    'The Shandur festival brings together polo teams from Chitral and Gilgit-Baltistan at the high-altitude Shandur polo ground. Pakistan''s national heritage register identifies the event as an element of social and festive heritage, while KP announced the 2026 festival for 11–13 June.',
    NULL,
    'Pakistan National Heritage Register; KP Government',
    'https://heritage.pakistan.gov.pk/SiteImage/Misc/files/ICH%20Pakistan%20Low.pdf?utm_source=chatgpt.com'
  ),
  (
    'Freestyle Polo in Chitral',
    'Sport',
    'Polo has a longstanding place in Chitral''s sporting culture. The Shandur tournament is a traditional form of polo played between teams representing Chitral and Gilgit-Baltistan and has become one of the most visible cultural sporting events of the region.',
    NULL,
    'Government of Pakistan; National Heritage Register',
    'https://tourism.gov.pk/pakistan.html?utm_source=chatgpt.com'
  ),
  (
    'Traditional Chitrali Houses',
    'Architecture',
    'Traditional Khow and Kalash houses are adapted to mountain conditions and often use local timber, stone and mud. Documentation on Chitral''s built heritage describes traditional Khow houses known as Baipash and emphasizes the use of carved wood in local architecture.',
    NULL,
    'Visit Chitral Valley; UNESCO',
    'https://visitchitralvalley.com/about/?utm_source=chatgpt.com'
  ),
  (
    'History of Chitral',
    'History',
    'Historical accounts describe Chitral as a strategic mountain region between South and Central Asia. The district''s documented political history includes the Rais and Katoor dynasties, the Mehtarate, British intervention in the late nineteenth century, accession to Pakistan in 1947 and the end of princely administration in the late 1960s.',
    NULL,
    'District Courts Chitral; Government tourism material',
    'https://www.districtcourtschitral.gov.pk/DistrictHistory/?utm_source=chatgpt.com'
  ),
  (
    'Rais Dynasty',
    'History',
    'Historical sources place the Rais dynasty among the major medieval ruling houses of Chitral. Government tourism material describes Shah Nasir Rais as establishing a unified independent kingdom in the fourteenth century, while other historical accounts give differing end dates for Rais rule. CHAYTHRAAR should preserve that chronological uncertainty rather than present one date as unquestionable.',
    NULL,
    'Government tourism material; District Courts Chitral',
    'https://tourism.gov.pk/publications/Chitral.pdf?utm_source=chatgpt.com'
  ),
  (
    'Katoor Dynasty',
    'History',
    'The Katoor dynasty became the dominant ruling house of Chitral in the late sixteenth century and continued through the princely-state period. Its rulers used the title Mehtar and governed a strategically located mountain state linked to surrounding regions through high passes and political alliances.',
    NULL,
    'District Courts Chitral; historical scholarship',
    'https://www.districtcourtschitral.gov.pk/DistrictHistory/?utm_source=chatgpt.com'
  ),
  (
    'Aman-ul-Mulk',
    'History',
    'Aman-ul-Mulk was one of the most significant Mehtars of Chitral during the nineteenth century. Government tourism material identifies his long rule from 1857 to 1892 and places him immediately before the succession crisis that contributed to the events of 1895.',
    NULL,
    'Government of Pakistan tourism material; historical references',
    'https://tourism.gov.pk/publications/Chitral.pdf?utm_source=chatgpt.com'
  ),
  (
    'Shuja-ul-Mulk',
    'History',
    'Shuja-ul-Mulk became Mehtar during the upheavals of 1895 and subsequently ruled Chitral for decades. His reign coincided with the British period of influence and included administrative and political changes in the state.',
    NULL,
    'Historical records; Indian Biographical Dictionary',
    'https://en.wikisource.org/wiki/The_Indian_Biographical_Dictionary_%281915%29/Chitral%2C_Shuja-ul-Mulk%2C_Mehtar_of?utm_source=chatgpt.com'
  ),
  (
    'Siege of Chitral Fort, 1895',
    'History',
    'The Siege of Chitral was a major episode in the political and military history of the region. District historical records state that the British garrison in Chitral Fort was besieged for 48 days before relief forces arrived from different directions.',
    NULL,
    'District Courts Chitral; Government tourism material',
    'https://www.districtcourtschitral.gov.pk/DistrictHistory/?utm_source=chatgpt.com'
  ),
  (
    'Chitral''s Accession to Pakistan',
    'History',
    'After the end of British rule in the subcontinent, Chitral acceded to Pakistan in 1947. The former princely state subsequently lost its separate administrative status, with Chitral becoming part of Pakistan''s provincial administrative system in 1969.',
    NULL,
    'District Courts Chitral; Government tourism material',
    'https://www.districtcourtschitral.gov.pk/DistrictHistory/?utm_source=chatgpt.com'
  ),
  (
    'Gandharan Grave Culture in Chitral',
    'Archaeology',
    'Archaeological investigations have identified burial sites in Chitral associated with what researchers call the Gandharan Grave Culture. Excavations at sites including Sangoor, Parwak and Gankoreneotek produced pottery, beads, iron objects and human remains. Radiocarbon dates from these sites range from roughly 1000 BCE to 1000 CE, illustrating a long and complex archaeological sequence rather than a single simple historical period.',
    NULL,
    'Antiquity / University research',
    'https://antiquity.ac.uk/projgall/youngr318?utm_source=chatgpt.com'
  ),
  (
    'Chitral Museum',
    'Museums',
    'The Chitral Museum is part of the province''s archaeological and ethnological museum network. A recent Directorate of Archaeology and Museums report lists Chitral Museum among museums established by the provincial archaeology directorate and describes the wider role of such institutions in preserving and displaying heritage.',
    NULL,
    'Directorate of Archaeology & Museums, KP',
    'https://dost.kp.gov.pk/wp-content/uploads/2026/01/Archeology_TF-Report.pdf?utm_source=chatgpt.com'
  ),
  (
    'Bumburate / Kalasha Dur Museum',
    'Museums',
    'The Bumburate Museum, also associated with the Kalasha Dur cultural centre, preserves material connected with Kalasha and wider Hindu Kush culture. It provides a physical location for displaying cultural objects and heritage that CHAYTHRAAR can complement digitally.',
    NULL,
    'Directorate of Archaeology & Museums, KP',
    'https://dost.kp.gov.pk/wp-content/uploads/2026/01/Archeology_TF-Report.pdf?utm_source=chatgpt.com'
  );

insert into public.encyclopedia (
  title,
  category,
  content,
  image_url,
  source,
  source_url,
  media_url
)
select
  proposed.title,
  proposed.category,
  proposed.content,
  proposed.image_url,
  proposed.source,
  proposed.source_url,
  proposed.media_url
from (
  values
    (
      'Khosh Bigim',
      'Music',
      'Bashonu lists Khosh Bigim in its Khowar song catalogue and credits the poem to Ali Aman Khan. The source does not identify a recording performer or date; this entry preserves the poet attribution without assigning it to a modern performance.',
      null::text,
      'Bashonu — Khowar song archive',
      'https://bashonu.com/song/khosh-bigim-15',
      null::text
    ),
    (
      'Nano Begal',
      'Music',
      'Bashonu lists Nano Begal as a Khowar song and records its poet attribution as “folk song,” not an individual. This entry preserves that attribution and adds no unsupported date, performer, or historical context.',
      null::text,
      'Bashonu — Khowar song archive',
      'https://bashonu.com/song/nano-begal-27',
      null::text
    ),
    (
      'Shab Daraz',
      'Music',
      'Bashonu lists Shab Daraz as a Khowar song and records its poet attribution as “folk song,” not an individual. This entry preserves that attribution and adds no unsupported date, performer, or historical context.',
      null::text,
      'Bashonu — Khowar song archive',
      'https://bashonu.com/song/shab-daraz-295',
      null::text
    ),
    (
      'Yar-e-Man Hamin',
      'Music',
      'Bashonu lists this song under the title variants Yarman Hameen, Yorman Hameen, and Yademan Hameen, and attributes the poem to Baba Siyar (Mirza Muhammad Siyar). This is the source’s poet attribution; no modern performer, recording, or date is asserted.',
      null::text,
      'Bashonu — Khowar song archive',
      'https://bashonu.com/song/yarman-hameen-yorman-hameen-yademan-hameen-297',
      null::text
    ),
    (
      'Hup Gey Gey',
      'Music',
      'Bashonu lists this Khowar song as "Hup Gey Gey" and credits the poet as "Folk Song," not an individual. Its page embeds a YouTube recording whose watch-page title identifies Hup Gey Gey and describes it as Marhoom Khakki SB''s own-voice rendition; the video description says "Song by gull Nawaz khan Khakki." This record preserves the archive''s attribution without assigning individual authorship.',
      null::text,
      'Bashonu — Khowar song archive',
      'https://bashonu.com/song/hup-gey-gey-211',
      'https://www.youtube.com/watch?v=TbhBUxw6jZY'
    )
) as proposed(title, category, content, image_url, source, source_url, media_url)
where not exists (
  select 1
  from public.encyclopedia as existing
  where regexp_replace(lower(existing.title), '[^a-z0-9]+', '', 'g') = regexp_replace(lower(proposed.title), '[^a-z0-9]+', '', 'g')
    or (proposed.title = 'Yar-e-Man Hamin' and lower(existing.title) = any(array[
      'yarman hameen',
      'yorman hameen',
      'yademan hameen',
      'yar man hamin'
    ]))
    or (proposed.title = 'Hup Gey Gey' and lower(existing.title) = any(array[
      'hup gey gey',
      'hup ge ge',
      'huup ge ge',
      'hup gae gae',
      'ge ge',
      'gee gee',
      'gé gé'
    ]))
);

insert into public.encyclopedia (
  title,
  category,
  content,
  image_url,
  source,
  source_url,
  media_url
)
select
  proposed.title,
  proposed.category,
  proposed.content,
  proposed.image_url,
  proposed.source,
  proposed.source_url,
  proposed.media_url
from (
  values
    (
      'Ali Aman Khan',
      'Music',
      'Bashonu''s Khowar song archive credits Ali Aman Khan as the poet of "Khosh bigim." This record preserves that source attribution and work; the cited page does not provide biographical details or dates.',
      null::text,
      'Bashonu — Khowar song archive',
      'https://bashonu.com/song/khosh-bigim-15',
      null::text
    ),
    (
      'Baba Siyar (Mirza Muhammad Siyar)',
      'Music',
      'Bashonu''s Khowar song archive credits Baba Siyar (Mirza Muhammad Siyar) as the poet of "Yarman Hameen" and lists the title variants "Yorman Hameen" and "Yademan Hameen." This record preserves those source attributions; the cited page does not provide biographical details or dates.',
      null::text,
      'Bashonu — Khowar song archive',
      'https://bashonu.com/song/yarman-hameen-yorman-hameen-yademan-hameen-297',
      null::text
    )
) as proposed(title, category, content, image_url, source, source_url, media_url)
where not exists (
  select 1
  from public.encyclopedia as existing
  where lower(existing.title) = lower(proposed.title)
);

insert into public.encyclopedia (
  title,
  category,
  content,
  image_url,
  source,
  source_url,
  media_url
)
select
  proposed.title,
  proposed.category,
  proposed.content,
  proposed.image_url,
  proposed.source,
  proposed.source_url,
  proposed.media_url
from (
  values
    (
      'Ziarat Khan Zeerak',
      'Music',
      'Radio Pakistan identifies Ziyarat Khan Zeerak, alias Sonoghro Malang, as a Khowar poet, musician and singer. It describes more than 20 Khowar lyrics collectively as "MalangoKaloom." Bashonu credits the variant "Ziarat Khan Zirak (Sonoghro Malang)" as poet of "Yoor tori granish biti sher shayozo sora." Sources differ in spelling (Ziarat/Ziyarat; Zeerak/Zirak/Zarak).',
      null::text,
      'Radio Pakistan; Bashonu — Khowar song archive; Chitral Today',
      'https://www.radio.gov.pk/programme/29-07-2020/feature-about-ziyarat-khan-zeerak-famous-chitrali-poet-musician-singer',
      'https://www.youtube.com/watch?v=rYxWf4feAw8&source_ve_path=MTc4NDI0',
      array['ziarat khan zeerak', 'ziyarat khan zeerak', 'ziarat khan zirak', 'ziarat khan zarak', 'sonoghro malang']::text[]
    ),
    (
      'Iqbal Uddin Sahar',
      'Music',
      'Khowari''s profile, labeled as an AI translation from Urdu, identifies Iqbal Uddin Sahar (also written Iqbaluddin Sahar) as a Khowar poet and singer and names Arzoo-e-Sahar as his first poetry collection. Bashonu credits him as poet of "Haya Hase Angar (urdu)."',
      null::text,
      'Khowari; Bashonu — Khowar song archive',
      'https://khowari.com/?p=3700',
      'https://www.youtube.com/watch?v=vfIeLQvo250&source_ve_path=MTc4NDI0',
      array['iqbal uddin sahar', 'iqbaluddin sahar']::text[]
    ),
    (
      'Afzal Ullah Afzal',
      'Music',
      'Dawn''s EOS profile names Afzal Ullah Afzal among Khowar ghazal poets and reports that Mansoor Ali Shabab sang his lyrics more than those of any other poet. Bashonu credits Afzal as poet of "Ko hotam hir ta poshi ase ma tan yadi no goi."',
      null::text,
      'Dawn, EOS; Bashonu — Khowar song archive',
      'https://www.dawn.com/news/1321358',
      'https://www.youtube.com/watch?v=iWL5Nv9vJ6Q&source_ve_path=MTc4NDI0',
      array['afzal ullah afzal', 'afzalullah afzal', 'afzalullahafzal']::text[]
    ),
    (
      'Amin-ur-Rehman Chughtai',
      'Poets',
      'UCL Press''s open-access A Grammar of Khowar cites Sher Nawaz Naseem''s 1987 article "Kohwar poets, Amin-ur-Rehman Chughtai." Dawn lists Ameen ur Rehman Chughtai among Khowar ghazal poets. A Zovalu Chitral interview uses Amin ur Rehman Chughtai and states that he authored two books without naming them. Sources vary in spelling and hyphenation (Amin/Ameen; Amin-ur-Rehman/Amin ur Rehman).',
      null::text,
      'UCL Press; Dawn, EOS; Zovalu Chitral',
      'https://discovery.ucl.ac.uk/id/eprint/10209238/1/A-Grammar-of-Khowar.pdf',
      'https://www.youtube.com/watch?v=NeRuND5Aw24',
      array['amin-ur-rehman chughtai', 'amin ur rehman chughtai', 'ameen ur rehman chughtai', 'ameen-ur-rehman chughtai']::text[]
    )
) as proposed(title, category, content, image_url, source, source_url, media_url, aliases)
where not exists (
  select 1
  from public.encyclopedia as existing
  where lower(existing.title) = any(proposed.aliases)
);

insert into public.encyclopedia (
  title,
  category,
  content,
  image_url,
  source,
  source_url
)
select
  proposed.title,
  proposed.category,
  proposed.content,
  proposed.image_url,
  proposed.source,
  proposed.source_url
from (
  values
    (
      'Chitrali Sitar',
      'Music',
      'Local writer Saifud Din describes the Chitrali sithar as a string instrument and one of the basic instruments of Chitrali music. His account describes five strings, with the upper two used for melody, and notes instrumental use in free-style polo music. The same account gives conflicting origin traditions, so this entry makes no origin claim.',
      null::text,
      'Saifud Din, “Chitrali Sithar,” Mahraka (2020)',
      'https://mahraka.com/chitrali_sithar.html'
    ),
    (
      'Surnai in Khowar Music',
      'Music',
      'Sifud Din''s account of Khowar music lists surnai, which he glosses as a clarinet, among the instruments used to render remembered local melodies, alongside flute and sitar. This entry records that source-specific association without claiming a fixed ensemble or universal performance setting.',
      null::text,
      'Sifud Din, “Genesis of Khowar Music,” Mahraka',
      'https://mahraka.com/chitrali_music.html'
    ),
    (
      'Kalasha Festival Dance',
      'Music',
      'The Pakistan State Party''s UNESCO Tentative List entry for the Kalasha Valley Cultural Landscape describes festival music and dance as part of Kalasha intangible heritage and identifies Palawjaw in Bumburet as a place for communal festival dances. This entry is specifically about Kalasha practice; the source does not establish a single choreography or a dhol accompaniment.',
      null::text,
      'Pakistan State Party, “Kalasha Valley Cultural Landscape,” UNESCO World Heritage Centre Tentative List (2026)',
      'https://whc.unesco.org/en/tentativelists/6965/'
    ),
    (
      'Ghalmandi',
      'Food',
      'SOCH Outreach Foundation documents Ghalmandi as a Chitrali dish: two thin rotis filled with cottage cheese, milk, and dried coriander. Its exhibit says the dish is finished with hot walnut oil or homemade desi ghee. The exhibit also uses Ghallmandi; the supplied spelling Gholmadi is not confirmed as an alias.',
      null::text,
      'SOCH Outreach Foundation, Google Arts & Culture',
      'https://artsandculture.google.com/asset/ghalmandi/NQFg4tks6-PqDA'
    ),
    (
      'Cheera Shapik',
      'Food',
      'SOCH Outreach Foundation documents Cheera Shapik in a Chitral-created food exhibit. The exhibit describes a thin-roti filling made as a cooked flour-and-milk paste and notes the use of hot walnut oil or homemade desi ghee. The 1998 Chitral census report also lists Shira Shapik; the available sources do not establish whether those spellings denote the same item, so this record retains the exhibit spelling.',
      null::text,
      'SOCH Outreach Foundation, Google Arts & Culture; Population Census Organization, Government of Pakistan, 1998 District Census Report of Chitral, p. 25',
      'https://artsandculture.google.com/asset/ingredients-for-cheera-shapik/1AFlu8y7KqYJuA'
    ),
    (
      'Lajhaik Soup',
      'Food',
      'SOCH Outreach Foundation includes Lajhaik soup on a traditional Chitrali menu created in Chitral. The exhibit title documents the dish name but does not provide enough recipe detail for this entry to claim ingredients or preparation. The supplied spelling Laxik is not confirmed as an alias.',
      null::text,
      'SOCH Outreach Foundation, Google Arts & Culture',
      'https://artsandculture.google.com/asset/traditional-chitrali-menu-with-lajhaik-soup-laganu-soup-and-chitrali-rice/PgFHMnLfLiWlxg'
    ),
    (
      'Laganu Soup',
      'Food',
      'SOCH Outreach Foundation documents Chitrali Leganu as a soup made from crushed pulses formed into small balls and boiled, then served in a liquid of onion, tomato, red pepper, and desi ghee; meat is optional in the account. The exhibit title uses Laganu while its text uses Leganu; both forms are retained as source spellings.',
      null::text,
      'SOCH Outreach Foundation, Google Arts & Culture',
      'https://artsandculture.google.com/asset/traditional-chitrali-menu-with-lajhaik-soup-laganu-soup-and-chitrali-rice/PgFHMnLfLiWlxg'
    ),
    (
      'Kavirough Soup',
      'Food',
      'SOCH Outreach Foundation identifies Kavirough as a Chitrali soup made with the local herb Kaveer and meat. Its description says the herb is boiled before it is combined with meat. The supplied form Kaveer Ough is not independently confirmed as an alias for Kavirough.',
      null::text,
      'SOCH Outreach Foundation, Google Arts & Culture',
      'https://artsandculture.google.com/asset/traditional-chitrali-menu-with-lajhaik-soup-laganu-soup-and-chitrali-rice/PgFHMnLfLiWlxg'
    ),
    (
      'Rishiki',
      'Food',
      'The 1998 Chitral census report identifies Rishiki as a typical Kalash bread made from wheat flour and ghee. This record therefore labels it specifically as Kalasha food; it does not generalize the dish to all Chitral communities. The supplied spelling Rishoki differs from the report and is not confirmed as an alias.',
      null::text,
      'Population Census Organization, Government of Pakistan, 1998 District Census Report of Chitral, p. 25',
      'http://digitalarchive.uet.edu.pk/handle/123456789/535'
    ),
    (
      'Sanabachi',
      'Food',
      'The 1998 Chitral census report lists Sanabachi among foods prepared locally in Chitral and describes it as made from flour and butter oil. The source does not provide further preparation detail in the cited passage.',
      null::text,
      'Population Census Organization, Government of Pakistan, 1998 District Census Report of Chitral, p. 25',
      'http://digitalarchive.uet.edu.pk/handle/123456789/535'
    ),
    (
      'Shoshp',
      'Food',
      'The 1998 Chitral census report lists Shoshp among foods prepared locally and describes it as made from wheat flour with walnut oil or ghee. This entry does not add further ingredients or a fixed recipe.',
      null::text,
      'Population Census Organization, Government of Pakistan, 1998 District Census Report of Chitral, p. 25',
      'http://digitalarchive.uet.edu.pk/handle/123456789/535'
    ),
) as proposed(title, category, content, image_url, source, source_url)
where not exists (
  select 1
  from public.encyclopedia as existing
  where regexp_replace(lower(existing.title), '[^a-z0-9]+', '', 'g') = regexp_replace(lower(proposed.title), '[^a-z0-9]+', '', 'g')
     or (proposed.title = 'Ghalmandi' and lower(existing.title) = 'ghallmandi')
     or (proposed.title = 'Cheera Shapik' and lower(existing.title) = any(array['chira shapik', 'shira shapik']))
     or (proposed.title = 'Laganu Soup' and lower(existing.title) = any(array['leganu soup', 'leganu', 'laganu']))
    or (proposed.title = 'Kavirough Soup' and lower(existing.title) = 'kavirough')
);

insert into public.encyclopedia (
  title,
  category,
  content,
  image_url,
  source,
  source_url,
  media_url
)
select
  proposed.title,
  proposed.category,
  proposed.content,
  proposed.image_url,
  proposed.source,
  proposed.source_url,
  proposed.media_url
from (
  values
    (
      'Ali Zuhoor Khan',
      'Music',
      'Mahraka''s interview-based profile identifies Ali Zuhoor Khan as a Chitral sitar player and composer. It describes his sitar performances, compositions, and work with other local musicians; the profile records no single instrument-origin account as fact.',
      null::text,
      'Shams ud Din, “The Gem of Sitar Players: Ali Zuhoor,” Mahraka; interviews and Radio Pakistan audio interview cited by the author',
      'https://mahraka.com/ali_zuhur.html',
      null::text
    ),
    (
      'Sultan Ghani',
      'Music',
      'In a first-person profile, Sultan Ghani describes his work as a Chitral sitar player and music teacher. Mahraka identifies him as a founding member of Al-Fatah Music Group and records his account of learning and performing Chitrali sitar music.',
      null::text,
      'Shams ud Din, “The Sultan of Strings,” Mahraka (2016)',
      'https://mahraka.com/sultanGhani.html',
      null::text
    ),
    (
      'Mir Wali (Kuragho Master)',
      'Music',
      'Mahraka identifies Mir Wali of Kuragh as a Chitral folk singer and artist. His interview discusses Khowar folk songs, singing, and learning Chitrali sitar; it names Yar Man Hameen among the songs he sings and describes the community context as Khowar rather than universal to all Chitral.',
      null::text,
      'Shams ud Din, “Mir Wali (Kuragho Master): Reflections on Khowar’s Folk Music,” Mahraka',
      'https://mahraka.com/mir_wali.html',
      null::text
    ),
    (
      'Ustad Taleem Khan',
      'Music',
      'Sifud Din’s account of Khowar music identifies Ustad Taleem Khan as a well-known surnai player. This record preserves that instrument-specific attribution and makes no claim about exclusivity or present-day status.',
      null::text,
      'Sifud Din, “Genesis of Khowar Music,” Mahraka',
      'https://mahraka.com/chitrali_music.html',
      null::text
    ),
    (
      'Amir Gul Amir',
      'Music',
      'Mahraka’s profile of sitar player Sultan Ghani describes Amir Gul Amir as a Khowar songwriter, composer, singer, and sitar player, and identifies him as one of the musicians who influenced Ghani’s learning.',
      null::text,
      'Shams ud Din, “The Sultan of Strings,” Mahraka (2016)',
      'https://mahraka.com/sultanGhani.html',
      null::text
    ),
    (
      'Ghulam Nabi (Phuk Brar)',
      'Music',
      'Mahraka’s profile of Sultan Ghani recalls Ghulam Nabi, also called Phuk Brar, as a singer who performed to the accompaniment of his own sitar. The entry records this specific local music context without adding a biography or date not supplied by the source.',
      null::text,
      'Shams ud Din, “The Sultan of Strings,” Mahraka (2016)',
      'https://mahraka.com/sultanGhani.html',
      null::text
    ),
    (
      'Fatahuddin',
      'Music',
      'Mahraka identifies Fatahuddin as a Khowar singer associated with Al-Fatah Music Group and credits him with helping sustain Khowar folk music in the group’s early period. The entry does not extend that claim to all Chitral communities.',
      null::text,
      'Shams ud Din, “The Sultan of Strings,” Mahraka (2016)',
      'https://mahraka.com/sultanGhani.html',
      null::text
    ),
    (
      'Bahader Khan',
      'Music',
      'Mahraka’s interview-based profile of Ali Zuhoor identifies Bahader Khan as a singer in Zuhoor’s music group and records his account of singing with Zuhoor and recording songs for Radio Pakistan Peshawar in 1975. No additional song titles or performance dates are inferred here.',
      null::text,
      'Shams ud Din, “The Gem of Sitar Players: Ali Zuhoor,” Mahraka; Bahader Khan interview quoted by the author',
      'https://mahraka.com/ali_zuhur.html',
      null::text
    ),
    (
      'Al-Fatah Music Group',
      'Music',
      'Mahraka identifies Al-Fatah as a music group with sitar player Sultan Ghani as a founding member and Khowar singer Fatahuddin as its namesake. Its account places the group in Chitral’s Khowar folk-music context during the 1980s.',
      null::text,
      'Shams ud Din, “The Sultan of Strings,” Mahraka (2016)',
      'https://mahraka.com/sultanGhani.html',
      null::text
    ),
    (
      'Pasture Flute in Khowar Music',
      'Music',
      'In an interview published by Mahraka, Mir Wali recalls pasture flutists playing while tending cattle in early spring and describes the sound carrying through nearby rock. This is presented as his recollection of a local Khowar music practice, not as a claim that the practice is universal or unchanged today.',
      null::text,
      'Shams ud Din, “Mir Wali (Kuragho Master): Reflections on Khowar’s Folk Music,” Mahraka',
      'https://mahraka.com/mir_wali.html',
      null::text
    ),
    (
      'Drum Accompaniment in Chitrali Sitar Music',
      'Music',
      'Mahraka’s interview-based profile of Ali Zuhoor recounts a drummer in his music group and describes the sitar melody responding as the drumbeat quickened. The source identifies drum accompaniment generally, not a dhol, so this entry does not name a specific drum or claim that it is unique to Chitral.',
      null::text,
      'Shams ud Din, “The Gem of Sitar Players: Ali Zuhoor,” Mahraka; interviews quoted by the author',
      'https://mahraka.com/ali_zuhur.html',
      null::text
    ),
    (
      'Haya Hase Angar',
      'Music',
      'Bashonu’s Khowar song archive lists Haya Hase Angar and credits its poem to Iqbal Uddin Sahar. This entry records the archived song and attribution without assigning a performer or date not identified by the source.',
      null::text,
      'Bashonu, Khowar song archive',
      'https://bashonu.com/song/haya-hase-angar-143',
      null::text
    ),
    (
      'Awa Pee Pee Nasha',
      'Music',
      'Bashonu’s Khowar song archive lists Awa Pee Pee Nasha and credits the poem to Afzal Ullah Afzal. The entry identifies the archived song and its poet; it does not assert a particular recording performer.',
      null::text,
      'Bashonu, Khowar song archive',
      'https://bashonu.com/song/awa-pee-pee-nasha-284',
      null::text
    ),
    (
      'Ko Hotam Hir Ta Poshi Ase Ma Tan Yadi No Goi',
      'Music',
      'Bashonu’s Khowar song archive lists this song under its Khowar title and credits the poem to Afzal Ullah Afzal. The entry preserves the archive title and poet attribution without claiming a recording performer.',
      null::text,
      'Bashonu, Khowar song archive',
      'https://bashonu.com/song/ko-hotam-hir-ta-poshi-ase-ma-tan-yadi-no-goi-357',
      null::text
    ),
    (
      'Yoor Tori Granish Biti Sher Shayozo Sora',
      'Music',
      'Bashonu’s Khowar song archive lists this song and credits the poem to Ziarat Khan Zirak (Sonoghro Malang). This is the source’s spelling and attribution; it is associated with the existing Ziarat Khan Zeerak music profile without creating a second person record.',
      null::text,
      'Bashonu, Khowar song archive',
      'https://bashonu.com/song/yoor-tori-granish-biti-sher-shayozo-sora-333',
      null::text
    ),
    (
      'Shah Gule Zar',
      'Music',
      'Sifud Din’s account of Khowar music lists Shah Gule Zar among the sitar players associated with its discussed local melodies. This entry records the source’s performer attribution without adopting the folklore origin account also recounted in the essay.',
      null::text,
      'Sifud Din, “Genesis of Khowar Music,” Mahraka',
      'https://mahraka.com/chitrali_music.html',
      null::text
    ),
    (
      'Afsar Khan of Miragram-I',
      'Music',
      'Sifud Din’s account identifies Afsar Khan of Miragram-I as a sitar player and says the author interviewed and recorded him. The entry preserves that specific documentation and does not infer a broader career timeline.',
      null::text,
      'Sifud Din, “Genesis of Khowar Music,” Mahraka',
      'https://mahraka.com/chitrali_music.html',
      null::text
    ),
    (
      'Farman Ali Taj',
      'Music',
      'Sifud Din’s account of Khowar music names Farman Ali Taj among sitar players associated with local melodies. This entry records the named musical attribution without extending the source’s account into unsupported dates or biographical claims.',
      null::text,
      'Sifud Din, “Genesis of Khowar Music,” Mahraka',
      'https://mahraka.com/chitrali_music.html',
      null::text
    ),
    (
      'Mansoor Shabab',
      'Music',
      'In an interview published by Mahraka, Mir Wali names Mansoor Shabab as a Khowar singer and comments on his singing of older songs. This entry attributes the description to Mir Wali rather than presenting it as a universal judgment.',
      null::text,
      'Shams ud Din, “Mir Wali (Kuragho Master): Reflections on Khowar’s Folk Music,” Mahraka',
      'https://mahraka.com/mir_wali.html',
      null::text
    ),
    (
      'Dani and Sauz in Khowar Music',
      'Music',
      'Sifud Din’s essay discusses Dani and Sauz as terms used in Khowar music and proposes that they refer to tempo or lay rather than distinct genres. The essay also notes differing interpretations, so this records the author’s view rather than a settled universal classification.',
      null::text,
      'Sifud Din, “Genesis of Khowar Music,” Mahraka',
      'https://mahraka.com/chitrali_music.html',
      null::text
    )
) as proposed(title, category, content, image_url, source, source_url, media_url)
where not exists (
  select 1
  from public.encyclopedia as existing
  where regexp_replace(lower(existing.title), '[^a-z0-9]+', '', 'g') = regexp_replace(lower(proposed.title), '[^a-z0-9]+', '', 'g')
     or (proposed.title = 'Haya Hase Angar' and lower(existing.title) = any(array['haya hase angar (urdu)', 'haya hase angaar']))
     or (proposed.title = 'Ali Zuhoor Khan' and lower(existing.title) = any(array['ali zuhur khan', 'ali zuhoor']))
     or (proposed.title = 'Mir Wali (Kuragho Master)' and lower(existing.title) = any(array['mir wali', 'kuragho master']))
     or (proposed.title = 'Ghulam Nabi (Phuk Brar)' and lower(existing.title) = any(array['ghulam nabi', 'phuk brar']))
     or (proposed.title = 'Fatahuddin' and lower(existing.title) = 'fatah uddin')
     or (proposed.title = 'Bahader Khan' and lower(existing.title) = 'bahder khan')
     or (proposed.title = 'Al-Fatah Music Group' and lower(existing.title) = 'al fatah music group')
     or (proposed.title = 'Pasture Flute in Khowar Music' and lower(existing.title) = 'pasture flute')
     or (proposed.title = 'Ko Hotam Hir Ta Poshi Ase Ma Tan Yadi No Goi' and lower(existing.title) like 'ko hotam hir ta poshi%')
    or (proposed.title = 'Shah Gule Zar' and lower(existing.title) = 'shah guli zar')
    or (proposed.title = 'Afsar Khan of Miragram-I' and lower(existing.title) = any(array['afsar khan', 'absar khan', 'afsar khan miragram']))
    or (proposed.title = 'Mansoor Shabab' and lower(existing.title) = 'mansoor ali shabab')
    or (proposed.title = 'Dani and Sauz in Khowar Music' and lower(existing.title) = any(array['dani sauz', 'dani and sauz']))
);
