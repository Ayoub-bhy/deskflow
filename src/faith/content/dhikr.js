/**
 * Desk-friendly dhikr. `weight` biases random selection; `friday` entries are
 * boosted on Fridays (salawat). `count` is the suggested tasbih count in the
 * dhikr overlay. Sources are the well-known sahih narrations recommending each.
 */
export default [
  { id: 'salawat', ar: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', tr: 'Allahumma salli wa sallim ‘ala nabiyyina Muhammad', en: 'O Allah, send blessings and peace upon our Prophet Muhammad ﷺ.', fr: 'Ô Allah, prie et accorde la paix à notre Prophète Muhammad ﷺ.', count: 10, weight: 3, friday: true, ref: 'Muslim 408' },
  { id: 'subhanallah', ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', tr: 'Subhan Allahi wa bihamdih', en: 'Glory be to Allah and praise Him.', fr: 'Gloire et louange à Allah.', count: 33, weight: 3, ref: 'Bukhari 6405' },
  { id: 'alhamdulillah', ar: 'الْحَمْدُ لِلَّهِ', tr: 'Alhamdulillah', en: 'All praise is for Allah.', fr: 'Louange à Allah.', count: 33, weight: 3, ref: 'Muslim 223' },
  { id: 'allahuakbar', ar: 'اللَّهُ أَكْبَرُ', tr: 'Allahu akbar', en: 'Allah is the Greatest.', fr: 'Allah est le plus Grand.', count: 33, weight: 2, ref: 'Muslim 597' },
  { id: 'istighfar', ar: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', tr: 'Astaghfirullaha wa atubu ilayh', en: 'I seek Allah’s forgiveness and turn to Him.', fr: 'Je demande pardon à Allah et je reviens à Lui.', count: 33, weight: 3, ref: 'Bukhari 6307' },
  { id: 'tahlil', ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', tr: 'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ‘ala kulli shay’in qadir', en: 'There is no god but Allah alone, without partner; His is the dominion and the praise, and He is able to do all things.', fr: 'Il n’y a de divinité qu’Allah, Seul, sans associé ; à Lui la royauté et la louange, et Il est capable de toute chose.', count: 10, weight: 2, ref: 'Bukhari 3293, Muslim 2691' },
  { id: 'hawqala', ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', tr: 'La hawla wa la quwwata illa billah', en: 'There is no power nor strength except through Allah.', fr: 'Il n’y a de force ni de puissance qu’en Allah.', count: 10, weight: 2, ref: 'Bukhari 4205, Muslim 2704' },
  { id: 'hasbuna', ar: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', tr: 'Hasbunallahu wa ni‘mal-wakil', en: 'Allah is sufficient for us, and He is the best Disposer of affairs.', fr: 'Allah nous suffit ; Il est le meilleur Garant.', count: 7, weight: 2, ref: 'Bukhari 4563' },
  { id: 'subhanallah-azim', ar: 'سُبْحَانَ اللَّهِ الْعَظِيمِ', tr: 'Subhan Allahil-‘Azim', en: 'Glory be to Allah, the Magnificent.', fr: 'Gloire à Allah, l’Immense.', count: 33, weight: 2, ref: 'Bukhari 6406' },
  { id: 'rabbi-zidni', ar: 'رَبِّ زِدْنِي عِلْمًا', tr: 'Rabbi zidni ‘ilma', en: 'My Lord, increase me in knowledge.', fr: 'Seigneur, accrois mon savoir.', count: 3, weight: 1, ref: 'Qur’an 20:114' },
]
