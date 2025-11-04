// بسم الله الرحمن الرحيم ✨
// Free Fire Profile Info Scraper
// أداة استخراج معلومات ملف Free Fire

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج معلومات ملف Free Fire باستخدام ID اللاعب
 * @param {string} playerId - ID اللاعب
 * @returns {Promise<object>}
 */
async function getFreeFireProfile(playerId) {
  try {
    // بناء رابط الملف الشخصي
    const url = `https://freefirejornal.com/perfil-jogador-freefire/${playerId}/`;
    
    // إرسال طلب HTTP
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);
    
    const profileInfo = {};
    
    // استخراج المعلومات الأساسية
    $('li.list-group-item').each((index, element) => {
      const text = $(element).text().trim();
      
      if (text.includes('👤 Nickname:')) {
        profileInfo.nickname = text.replace('👤 Nickname:', '').trim();
      } else if (text.includes('🆔 ID:')) {
        profileInfo.id = text.replace('🆔 ID:', '').trim();
      } else if (text.includes('🥇 Prime:')) {
        profileInfo.prime = text.replace('🥇 Prime:', '').trim();
      } else if (text.includes('🌎 Região:')) {
        profileInfo.region = text.replace('🌎 Região:', '').trim();
      } else if (text.includes('🎖️ Nível:')) {
        profileInfo.level = text.replace('🎖️ Nível:', '').trim();
      } else if (text.includes('📈 Experiência (XP):')) {
        profileInfo.xp = text.replace('📈 Experiência (XP):', '').trim();
      } else if (text.includes('🏆 Pontos de Ranqueada:')) {
        profileInfo.rank_points = text.replace('🏆 Pontos de Ranqueada:', '').trim();
      } else if (text.includes('📢 Influenciador:')) {
        profileInfo.influencer = text.replace('📢 Influenciador:', '').trim();
      } else if (text.includes('👍 Likes:')) {
        profileInfo.likes = text.replace('👍 Likes:', '').trim();
      } else if (text.includes('📝 Assinatura – Bio:')) {
        const bioText = $(element).find('span.bio-text');
        if (bioText.length) {
          profileInfo.bio = bioText.text().trim();
        }
      } else if (text.includes('🕒 Último Login:')) {
        profileInfo.last_login = text.replace('🕒 Último Login:', '').trim();
      } else if (text.includes('📅 Conta Criada:')) {
        profileInfo.account_created = text.replace('📅 Conta Criada:', '').trim();
      } else if (text.includes('🔄 Perfil Atualizado:')) {
        profileInfo.profile_updated = text.replace('🔄 Perfil Atualizado:', '').trim();
      }
    });
    
    // استخراج الإحصائيات
    $('div.stats-details li.list-group-item').each((index, element) => {
      const text = $(element).text().trim();
      
      if (text.includes('Partidas:')) {
        profileInfo.matches = text.replace('Partidas:', '').trim();
      } else if (text.includes('Vitórias:')) {
        profileInfo.wins = text.replace('Vitórias:', '').trim();
      } else if (text.includes('Abates:')) {
        profileInfo.kills = text.replace('Abates:', '').trim();
      } else if (text.includes('Top 10/5/3:')) {
        profileInfo.top_places = text.replace('Top 10/5/3:', '').trim();
      } else if (text.includes('Taxa de Top 10/5/3:')) {
        profileInfo.top_rate = text.replace('Taxa de Top 10/5/3:', '').trim();
      } else if (text.includes('Taxa A/M:')) {
        profileInfo.kdr = text.replace('Taxa A/M:', '').trim();
      } else if (text.includes('Média de KM Percorrido:')) {
        profileInfo.avg_distance = text.replace('Média de KM Percorrido:', '').trim();
      } else if (text.includes('Média de Sobrevivência:')) {
        profileInfo.avg_survival = text.replace('Média de Sobrevivência:', '').trim();
      } else if (text.includes('Máximo de Abates em Jogo:')) {
        profileInfo.max_kills = text.replace('Máximo de Abates em Jogo:', '').trim();
      } else if (text.includes('Média de Dano:')) {
        profileInfo.avg_damage = text.replace('Média de Dano:', '').trim();
      } else if (text.includes('Abates com Veículo:')) {
        profileInfo.vehicle_kills = text.replace('Abates com Veículo:', '').trim();
      } else if (text.includes('Tiros na Cabeça:')) {
        profileInfo.headshots = text.replace('Tiros na Cabeça:', '').trim();
      } else if (text.includes('Taxa de Tiros na Cabeça:')) {
        profileInfo.headshot_rate = text.replace('Taxa de Tiros na Cabeça:', '').trim();
      }
    });
    
    return profileInfo;
    
  } catch (error) {
    throw new Error(`Error fetching profile: ${error.message}`);
  }
}

/**
 * ترجمة مصطلحات الإحصائيات من البرتغالية إلى العربية
 * @param {string} statsText - النص بالإنجليزية
 * @returns {string}
 */
function translateStatsToArabic(statsText) {
  const translations = {
    'Solo': 'منفرد',
    'Duo': 'زوجي',
    'Squad': 'فرقة',
    'Taxa de': 'نسبة',
    'Média de': 'متوسط',
    'KM Percorrido': 'الكيلومترات المقطوعة',
    'Sobrevivência': 'البقاء على قيد الحياة',
    'Máximo de': 'أقصى',
    'Abates em Jogo': 'قتلى في المباراة',
    'Dano': 'الضرر',
    'Abates com Veículo': 'قتلى بالمركبة',
    'Tiros na Cabeça': 'إصابات الرأس',
    'Taxa de Tiros na Cabeça': 'نسبة إصابات الرأس',
    'Partidas': 'المباريات',
    'Vitórias': 'الانتصارات',
    'Abates': 'القتلى',
    'Top 10/5/3': 'أعلى 10/5/3'
  };
  
  let translatedText = statsText;
  for (const [portuguese, arabic] of Object.entries(translations)) {
    translatedText = translatedText.replace(portuguese, arabic);
  }
  
  return translatedText;
}

/**
 * تنظيم وعرض المعلومات
 * @param {object} profileInfo - معلومات الملف
 * @returns {object}
 */
function organizeProfileInfo(profileInfo) {
  if (profileInfo.error) {
    return { error: profileInfo.error };
  }
  
  const organizedInfo = {
    basic_info: {},
    statistics: {}
  };
  
  // المعلومات الأساسية
  const basicFields = [
    ['nickname', 'Nickname'],
    ['id', 'Player ID'],
    ['prime', 'Prime Status'],
    ['region', 'Region'],
    ['level', 'Level'],
    ['xp', 'Experience'],
    ['rank_points', 'Rank Points'],
    ['influencer', 'Influencer'],
    ['likes', 'Likes'],
    ['bio', 'Bio'],
    ['last_login', 'Last Login'],
    ['account_created', 'Account Created'],
    ['profile_updated', 'Profile Updated']
  ];
  
  basicFields.forEach(([key, displayName]) => {
    if (profileInfo[key]) {
      organizedInfo.basic_info[displayName] = profileInfo[key];
    }
  });
  
  // الإحصائيات مع الترجمة
  const statsFields = [
    ['matches', 'Matches'],
    ['wins', 'Wins'],
    ['kills', 'Kills'],
    ['top_places', 'Top Places'],
    ['top_rate', 'Top Rate'],
    ['kdr', 'K/D Ratio'],
    ['avg_distance', 'Average Distance'],
    ['avg_survival', 'Average Survival'],
    ['max_kills', 'Max Kills'],
    ['avg_damage', 'Average Damage'],
    ['vehicle_kills', 'Vehicle Kills'],
    ['headshots', 'Headshots'],
    ['headshot_rate', 'Headshot Rate']
  ];
  
  statsFields.forEach(([key, displayName]) => {
    if (profileInfo[key]) {
      const translatedStats = translateStatsToArabic(profileInfo[key]);
      organizedInfo.statistics[displayName] = translatedStats;
    }
  });
  
  return organizedInfo;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/info/freefire?id=123456789
 */
router.get("/freefire", async (req, res) => {
  const playerId = req.query.id;
  
  if (!playerId) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Player ID is required"
    });
  }

  // التحقق من أن ID يحتوي على أرقام فقط
  if (!/^\d+$/.test(playerId)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Player ID must contain numbers only"
    });
  }

  try {
    const profileInfo = await getFreeFireProfile(playerId);
    const organizedInfo = organizeProfileInfo(profileInfo);
    
    if (organizedInfo.error) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: organizedInfo.error
      });
    }

    res.json({
      status: 200,
      success: true,
      player: {
        player_id: playerId,
        profile_info: organizedInfo
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "Error fetching player information",
      error: error.message
    });
  }
});

module.exports = {
  path: "/api/info",
  name: "Free Fire Info",
  type: "info",
  url: `${global.baseURL}/api/info/freefire?id=1010493740`,
  logo: "https://qu.ax/freefire.png",
  description: "جلب معوماات حسابات فري فاير عبر الايدي",
  router
};