// بسم الله الرحمن الرحيم ✨
// Free Fire Account Info Scraper API
// API d'extraction d'informations de compte Free Fire

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * Récupérer les informations du compte depuis l'API
 * @param {string} uid - ID du compte
 * @returns {Promise<object>}
 */
async function fetchAccountInfo(uid) {
  const url = `https://gameskinbo.com/api/free_fire_id_checker?uid=${uid}`;
  const { data } = await axios.get(url);
  return data;
}

/**
 * Extraire les champs du texte
 * @param {string} text - Texte brut
 * @returns {object}
 */
function extractFields(text) {
  if (!text) return {};
  
  const cleanText = text.split("🎆 Diwali Special Offer 🎆")[0];
  const fields = {};
  const lines = cleanText.split("\n");
  
  for (const line of lines) {
    const match = line.match(/├─ \*\*(.+?):\*\* `(.*?)`/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      fields[key] = value;
    }
  }
  
  return fields;
}

/**
 * Traduire les clés en français
 * @param {object} data - Données en anglais
 * @returns {object}
 */
function translateKeys(data) {
  const translations = {
    "Total Diamonds Topped Up & Claimed": "Total_Diamants",
    "Prime Level": "Niveau_Prime",
    "Name": "Nom",
    "UID": "ID",
    "Level": "Niveau",
    "Region": "Région",
    "Likes": "J'aimes",
    "Honor Score": "Points_Honneur",
    "Celebrity Status": "Statut_Célébrité",
    "Title": "Titre",
    "Signature": "Signature",
    "Most Recent OB": "Dernière_Version",
    "Booyah Pass": "Passe_Booyah",
    "Current BP Badges": "Badges_BP",
    "BR Rank": "Rang_BR",
    "CS Points": "Points_CS",
    "CS Peak Points": "Points_CS_Max",
    "Created At": "Date_Création",
    "Last Login": "Dernière_Connexion",
    "Avatar ID": "ID_Avatar",
    "Banner ID": "ID_Bannière",
    "Pin ID": "ID_Pin",
    "Equipped Skills": "Compétences_Équipées",
    "Equipped Gun ID": "ID_Arme",
    "Equipped Animation ID": "ID_Animation",
    "Transform Animation ID": "ID_Transformation",
    "Equipped?": "Animal_Équipé",
    "Pet Name": "Nom_Animal",
    "Pet Type": "Type_Animal",
    "Pet Exp": "Exp_Animal",
    "Pet Level": "Niveau_Animal",
    "Guild Name": "Nom_Guilde",
    "Guild ID": "ID_Guilde",
    "Guild Level": "Niveau_Guilde",
    "Guild Members": "Membres_Guilde",
    "Leader Name": "Nom_Chef",
    "Leader UID": "ID_Chef",
    "Leader Level": "Niveau_Chef",
    "Leader Created At": "Date_Création_Chef",
    "Leader Last Login": "Dernière_Connexion_Chef",
    "Leader Title": "Titre_Chef",
    "Leader Current BP Badges": "Badges_Chef",
    "Leader BR Points": "Points_BR_Chef",
    "Leader Cs Points": "Points_CS_Chef"
  };

  const translated = {};
  for (const [key, value] of Object.entries(data)) {
    const frenchKey = translations[key] || key;
    translated[frenchKey] = value;
  }
  
  return translated;
}

/**
 * Point de terminaison principal
 * Exemple:
 *   /api/info/freefire?id=123456789
 */
router.get("/freefire", async (req, res) => {
  const uid = req.query.id;
  if (!uid) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "المرجو تقديم ايدي صالح"
    });
  }

  try {
    const result = await fetchAccountInfo(uid);
    
    if (!result || !result.text) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "حدثت مشكله"
      });
    }

    const fields = extractFields(result.text);
    const frenchData = translateKeys(fields);
    
    const info = {
      ID: uid,
      Image_Bannière: result.banner_image ? `https://gameskinbo.com${result.banner_image}` : null,
      Informations_Compte: frenchData
    };

    res.json({
      status: 200,
      success: true,
      account: info
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "Erreur lors de l'extraction des informations du compte.",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/info",
  name: "info id freefire",
  type: "info",
  url: `${global.t}/api/info/freefire?id=1010493740`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب معلومات حول حساب فري فاير عبر الايدي",
  router
};