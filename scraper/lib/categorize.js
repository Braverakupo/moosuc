/**
 * Map a URL path to a category folder name.
 *
 * Rules are checked in order: path-prefix first, then filename patterns.
 *
 * @param {string} path - The relative URL path, e.g. "/Zeus.php" or "/doctrines/The_Havamal.php"
 * @returns {string} Category folder name, e.g. "03-Gods"
 */
export function categorize(path) {
  // Normalize: remove leading slash for matching
  const normalized = path.replace(/^\//, '');
  const segments = normalized.split('/');
  const filename = segments[segments.length - 1] || '';
  const firstSegment = segments[0];

  // =====================================================
  // 1. Subdirectory-based categories (check path prefix)
  // =====================================================

  if (firstSegment === 'doctrines') return '04-Doctrines';
  if (firstSegment === 'advancedphilosophy') return '05-Philosophy';
  if (firstSegment === 'enlightenment') return '11-Enlightenment';
  if (firstSegment === 'personalities') return '12-Personalities';
  if (firstSegment === 'family') return '13-Family';
  if (firstSegment === 'coven') return '14-Coven';

  // =====================================================
  // 2. Filename pattern-based categories (root-level only)
  // =====================================================

  const name = filename.replace(/\.php$/i, '');

  // --- 06-Zevism-Branches ---
  if (name.startsWith('Zevism_')) return '06-Zevism-Branches';

  // --- 07-Afterlife ---
  const afterlifePages = [
    'Zevist_Afterlife_Doctrine', 'Myth_of_Er', 'Judgement_of_Maat',
    'Orphic_Gold_Tablets', 'Tartarus', 'ZevistAfterlife', 'Afterlife'
  ];
  if (afterlifePages.includes(name)) return '07-Afterlife';

  // --- 08-Magick ---
  const magickPages = [
    'About_Hypnosis', 'Advanced_Thoughtforms', 'AURA', 'Banishing',
    'Binding_Spell', 'Blackarts', 'BLACKMAGICK', 'Black_Mirror', 'Candle',
    'Cardinal_Points', 'Color', 'Concentration', 'Creating_Elementals',
    'DEATH', 'Determining_Trance', 'Ectoplasm', 'Elements_Magick',
    'Energy_Ripping', 'Evil', 'Evocation', 'Fighting_Back', 'Fire_Form',
    'Healing', 'Healing_Info', 'Healing_Others', 'Herbs', 'Hypnosis',
    'Hypnotizing_Others', 'Incense', 'Love_Spell', 'mentalhealth', 'Mind',
    'Ouija', 'OUTDOORS', 'Overcoming_Obstacles', 'Pendulum', 'Pendulum_Practice',
    'Poppit', 'Props', 'Protection', 'Pyrokinesis', 'retrogrades',
    'Self_Hypnosis', 'Sex_Magick', 'Star_Magick', 'Telekinesis', 'Temple',
    'Thoughtform', 'ThreeFoldLie', 'Timing', 'Using_Crystals',
    'Using_Thoughtforms', 'VOID', 'Zevist_Healing2', 'Zevist_Hypnosis',
    'Words-of-Power', 'Words_of_Power', 'Zevist_Mala',
    'Communication_With_Guardian_Demons', 'SummoningGods',
    'About_Guardian_Daemons', 'Guardian', 'Demonic_Communication',
    'Evil_Eye', 'MagickalEnvironment', 'Planetary_Hours', 'Returning_Curses',
    'Soul_Energy', 'Sound', 'Necronomicon_Meditations', 'RAUM_Meditation',
    'FURCAS', 'NECROMANCY', 'PowersofMind', 'Runes',
    'Foundation_of_Witchcraft'
  ];
  if (magickPages.includes(name)) return '08-Magick';

  // --- 09-Squares ---
  if (name.endsWith('_Square') || name.endsWith('_Squares')) return '09-Squares';

  // --- 10-Chakras-Meditations ---
  const chakraMedPages = [
    'Chakras_More_Information', 'The_Chakras', 'Meditation', 'Meditation_Index',
    'Pineal_Meditation', 'Telepathy', 'Drawing_in_Energy', 'Invoking_Earth',
    'Invoking_Water', 'Evoking_Elements', 'Splitting_The_Soul', 'Chakras_Diagram',
    'Preparing_for_Meditation', 'Awareness_Lower_Triangle', 'Awareness_Middle_Triangle',
    'Djed_Pillar', 'Chakra_Alignment3', 'Opening_Chakras', 'OpeningChakras',
    'Activating_Legs_Feet_Chakras', 'Finding_Your_Meditation_Type', 'Dot_Meditation',
    'Self_Observation_Meditation', 'Recollection_Meditation',
    'Awareness_of_Smell_Meditation', 'Awareness_of_Touch_Meditation',
    'Sight_and_Visualization_Meditation', 'Chakra_Focus_Meditation',
    'Pythagorean_Day_Meditation', 'God_Sigil_Meditation', 'Ethics_Context_Meditation',
    'Side_Chakras_Awareness', 'Kundalini', 'Energy_Meditation', 'Flame_Meditation',
    'Aura_Empowering_Meditation', 'Blue_Light_Meditation', 'Color_Meditation',
    'Meditation_on_Zeus', 'Zevist_Numerology', 'Magnum_Opus'
  ];
  if (chakraMedPages.includes(name)) return '10-Chakras-Meditations';

  // --- 15-Rites ---
  const ritesPages = [
    'Baptism', 'Amphidromia', 'Ephebeia', 'Funeral', 'Zevic_Wedding',
    'Ritual', 'Advanced_Ritual', 'Consecration', 'Destruction',
    'Thanksgiving', 'Prayer', 'HOLIDAYS'
  ];
  if (ritesPages.includes(name)) return '15-Rites';

  // --- 16-Ethics ---
  if (name.startsWith('life_ethics_') || name === 'Ethics_Core' || name === 'Ethics_Life') {
    return '16-Ethics';
  }

  // --- 17-Virtues ---
  if (name.includes('_virtue_') || name.startsWith('Virtue_')) return '17-Virtues';

  // --- 18-Liturgical-Terms ---
  if (name.startsWith('liturgical_terms_')) return '18-Liturgical-Terms';

  // --- 19-Resources ---
  const resourcesPages = ['Rights_EU', 'Rights_International'];
  if (resourcesPages.includes(name)) return '19-Resources';

  // --- 03-Gods (individual deity pages) ---
  const godPages = [
    'Zeus', 'DyeusPitar', 'Atum', 'Indra', 'GodJupiter', 'Zen', 'Amun',
    'OdinName', 'Thor', 'Perun', 'Sabazios', 'Tengri', 'Beli', 'Hadad',
    'Hammon', 'Dagda', 'Zalmoxis', 'Ahuramazda', 'Marduk', 'Ngai', 'Nzazi',
    'Raijin', 'Shangdi', 'Shango', 'Tarhunt', 'Tinia', 'Tlaloc', 'Viracocha',
    'Perkunas', 'SATANAS', 'Beelzebul', 'SatanOdin', 'Baphomet'
  ];
  if (godPages.includes(name)) return '03-Gods';

  // --- 02-About ---
  const aboutPages = [
    'Our_God', 'TRADITIONAL', 'Our_Origins', 'EthicsOftheGods', 'Dedicate',
    'TheGods', 'Aware', 'Magick', 'Our_Doctrines', 'Afterlife_Info',
    'Symbols', 'Our_Rites', 'AdvancedPhilosophy', 'Zevism_Sanskrit',
    'ToZClergy', 'Our_Sermons', 'EL', 'Pantheon',
    'ChristianMysticismProclusTheft', 'TheOriginalGodsBehindAbrahamism',
    'EudaimoniaEndGoal', 'How_Zeus_Became_the_Devil', 'Duality_of_Divinity',
    'GodsInReverse', 'TheGreatSlander',
    'Freeing_the_Mind_from_Christianity_and_Islam', 'Hierarchy_of_the_Gods',
    'RelationWithTheGods', 'DabblingInZevism',
    'What_Connects_and_Disconnects_You_From_Gods', 'Purpose', 'Timelines',
    'SanskritForTruth', 'RITUALITEMS', 'Al_Jilwah', 'satanas_name',
    'Roots', 'YezidiPeacock', 'FOR', 'Outsiders', 'Queen',
    'Animal-Sacrifice-Double-Standard'
  ];
  if (aboutPages.includes(name)) return '02-About';

  // --- 01-Main (gateway pages) ---
  const mainPages = [
    'index', 'HOME', 'ForNewbies', 'Updates', 'Welcome', 'NEWPEOPLE',
    'FAQ', 'HELP', 'Resources', 'SERMONS'
  ];
  if (mainPages.includes(name)) return '01-Main';

  // Fallback - log and assign to Main
  console.warn(`[categorize] WARNING: No category match for "${path}" — assigning to 99-Uncategorized`);
  return '99-Uncategorized';
}
