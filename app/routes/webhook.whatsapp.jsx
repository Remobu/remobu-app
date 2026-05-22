export const config = { unstable_middleware: false };

import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VERIFY_TOKEN = (process.env.WEBHOOK_VERIFY_TOKEN || "").trim();
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function loader({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function action({ request }) {
  try {
    const text = await request.text();
    console.log("📨 Raw webhook body:", text);
    const body = JSON.parse(text);
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message) {
      console.log("⚠️ No message in payload");
      return json({ status: "no message" });
    }
    const from = message.from;
    // --- MULTIMODAL MESSAGE TYPE DETECTION ---
    let userMessage = "";
    const msgType = message.type;

    if (msgType === "text") {
      userMessage = message.text?.body || "";
    } else if (msgType === "audio" || msgType === "voice") {
      await sendWhatsAppMessage(from, "🎤 I received your voice message. Voice transcription is coming soon. Please type your question for now and I will assist you right away.");
      return json({ status: "ok" });
    } else if (msgType === "image") {
      const imgCaption = message.image?.caption || "";
      const imgLang = imgCaption ? ` (respond in the same language as this caption: "${imgCaption.slice(0,30)}")` : "";
      await sendWhatsAppMessage(from, "🖼️ I received your image." + (imgCaption ? ` You said: "${imgCaption}". Let me help!` : " Please describe what you see in text and I will assist you."));
      return json({ status: "ok" });
    } else if (msgType === "video") {
      const vidCaption = message.video?.caption || "";
      await sendWhatsAppMessage(from, "📹 I received your video." + (vidCaption ? ` You said: "${vidCaption}". Let me help!` : " Please describe your farming situation in text and I will assist you."));
      return json({ status: "ok" });
    } else {
      await sendWhatsAppMessage(from, "I received your message but I am not able to process that format yet. Please send a text message and I will help you right away.");
      return json({ status: "ok" });
    }

    if (!userMessage.trim()) return json({ status: "ok" });

    console.log(`📱 Message from ${from}: ${userMessage}`);

    // Editor-in-Chief override
    if (from === "26663475043" && userMessage.toLowerCase().startsWith("editor:")) {
      const overrides = global.editorInstructions || [];
      overrides.push(userMessage);
      if (overrides.length > 20) overrides.splice(0, overrides.length - 20);
      global.editorInstructions = overrides;
      await sendWhatsAppMessage(from, "🌿 *REMOBU Farm Advisor*\n✅ Instruction received and applied to all farmer responses.");
      return json({ status: "ok" });
    }


    // --- SEND INSTANT ACKNOWLEDGEMENT ---
    await sendWhatsAppMessage(from, "🌱 Received! Preparing your advice...");

    // --- GET GEMINI RESPONSE ---
    const rawReply = await getGeminiResponse(userMessage, from);
    const reply = rawReply
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/\*(.*?)\*/gs, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/`{1,3}/g, '')
      .trim();
    // Logo on first message only per session
    if (!global.seenFarmers) global.seenFarmers = new Set();
    if (!global.seenFarmers.has(from)) {
      global.seenFarmers.add(from);
      const isGreeting = /^(hi|hello|hie|sawubona|lumela|hey)$/i.test(userMessage.trim());
      const brandedReply = (isGreeting || !global.seenFarmers.has(from))
        ? `🌿 *REMOBU Farm Advisor*\n━━━━━━━━━━━━━━━━━━\n${reply}`
        : reply;

  // Save conversation to memory
  await prisma.conversation.create({ data: { phone: from, role: 'user', message: userMessage } });
  await prisma.conversation.create({ data: { phone: from, role: 'assistant', message: brandedReply } });

      await sendWhatsAppMessage(from, brandedReply);
    } else {
      await sendWhatsAppMessage(from, reply);
    }
    return json({ status: "ok" });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return json({ status: "error", error: err.message }, { status: 500 });
  }
}

// In-memory conversation history (keyed by phone number, last 10 turns)
const conversationStore = new Map();

async function getGeminiResponse(userMessage, from = "unknown") {
  // Load history for this farmer
  if (!conversationStore.has(from)) conversationStore.set(from, []);
  const history = conversationStore.get(from);

  // Build contents array with history

  // Fetch last 10 messages for this farmer
  const recentMessages = await prisma.conversation.findMany({
    where: { phone: from },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  history = recentMessages.reverse().map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.message }]
  }));

  const contents = [

    ...history,
    { role: "user", parts: [{ text: userMessage }] }
  ];
  // Apply Editor-in-Chief overrides
  const overrides = global.editorInstructions || [];
  const overrideText = overrides.length > 0 ? "\n\nEDITOR INSTRUCTIONS:\n" + overrides.join("\n") : "";

  const agriContext = `

REFERENCE AGRICULTURAL KNOWLEDGE (use as guidance for African smallholder farming):

Q: How do perennial vegetables benefit families affected by HIV/AIDS with small farms?
A: Perennial vegetables assist families, especially those with less land and financial resources, by ensuring consistent food supply with minimal labor and cost.  - **Low Maintenance:**   - **First:** Plant once and eliminate frequent planting, saving on seeds and labor costs.   - **Then:** Grow with ease, reducing time spent on pest control and other maintenance tasks.   - **Where useful:** Especially effective in areas with limited gardening space or resources. - **Sustainable Yield:**   - **Afte

Q: What sustainable practices can I adopt in nursery production to reduce environmental impact, especially tailored to local conditions?
A: To reduce environmental impact, adopt integrated pest management systems that tailor pest, disease, and weed control to your local conditions. Prioritize organic waste recycling, implement practices like water management for runoff control, and opt for locally available organic fertilizer alternatives. For instance, using compost can improve soil health, reduce synthetic inputs, and recycle waste efficiently.

Q: What should I ask myself before choosing a cereal crop for my area?
A: First, check if your region's climate is suitable for the crop you're considering. Then, determine if your soil type, pH, and salinity are appropriate. Ensure fertilizers for nitrogen, phosphate, and potassium are available. Next, assess if the crop's moisture needs can be met naturally via available water or irrigation. Confirm you have the necessary equipment and land. Also, investigate supply sources for seeds, fertilizers, and other needed items. Consider if you have enough capital to purcha

Q: How does 'passing on the gift' support community development and resource sharing? Are there specific examples of where this is practiced?
A: 'Passing on the gift' supports community development by creating a culture of sharing and mutual aid among families. For example, in many African villages, this practice involves giving offspring from animals like goats or chickens to another family. This cycle reinforces social bonds and community welfare by ensuring that resources are sustainably shared. The continuity of gifting creates an expanding network of animal stock for farming, helping families gain economic stability.

Q: What are the regional-specific irrigation strategies for optimizing coffee yield, taking into account climatic conditions and water management practices?
A: ### Regional-Specific Irrigation Strategies  Effective regional irrigation management is crucial for optimizing coffee yield:  - **Water Management Practices**: Implement under-tree irrigation systems such as drip and basin to minimize water usage, achieving 30 to 40% water savings without compromising yield. This approach is particularly beneficial in regions with limited water availability.  - **Disease Prevention Methods**: These systems are superior in preventing disease spread by reducing f

Q: How can I use traditional methods to keep my food secure from spoilage and pests during the off-season?
A: To keep your food secure using traditional methods, first dry your seeds and vegetables in sunny places or under shade to prevent spoilage. Use smoked coating on millet and sorghum tassels to deter pests. Mixing grain with bitter wood ash prevents pest infestations by keeping rodents away. However, be aware that traditional methods can sometimes be less effective in extreme weather. Regularly check your stored produce for any signs of spoilage or pest activity, such as holes or a bitter smell.

Q: What is an easy way to keep newly planted trees watered during the dry season?
A: To easily keep newly planted trees watered during the dry season, you can set up a simple and cost-effective irrigation system using large old cans or plastic bottles. Here's how you can do it: First, collect enough containers so that each tree or seed has one. Bury these containers vertically about 40 to 60 centimeters from each plant. Make holes in the base and sides of each container. During dry periods, fill each container with water from a tap or well, ensuring that the top is at ground lev

Q: What are the steps involved in using solar heat to sterilize soil for seedlings?
A: First, carefully prepare the area chosen as the nursery by removing stones and debris, digging and leveling the soil, and watering it abundantly. Next, cover it with a transparent plastic sheet, ensuring the seedbed is narrower than the plastic. Bury the edges of the plastic in a small trench and cover them with soil to secure the plastic. Leave the plastic over the soil for five sunny days. If cloudy days occur, leave it longer until the soil reaches high temperatures (40-50°C), killing most mi

Q: What technologies does iHub use to support farmers?
A: iHub supports farmers by utilizing technologies like artificial intelligence and machine learning to optimize farm management practices. These tools help farmers forecast market trends and make informed decisions, improving their returns. Blockchain technology is also used to ensure transparency and fairness in financial transactions, helping farmers receive accurate payments. Although high-tech, these tools can be simplified for practical use on farms.

Q: What does the phylogenetic overview of Boletineae reveal about evolutionary adaptations and morphologic diversity among its genera?
A: ### Phylogenetic Insights The study provides comprehensive insights on evolutionary adaptations and morphological diversity within Boletineae: - **Genetic Analysis**: Utilization of nuc-lsu, tef1, and RPB1 has provided a detailed phylogenetic framework, revealing complex evolutionary histories.  ### Morphological and Evolutionary Diversity - **Genus Reorganization**: Many morphologically defined genera are not monophyletic, highlighting a need for taxonomic revision. - **Evolutionary Transitions

Q: What emerging trends and challenges in global food insecurity are anticipated from the 2023 data?
A: ### Anticipated Trends and Challenges in Global Food Insecurity  **Regional Trends:**    - Disparities across regions, with noted improvements in Asia, contrasting with worsening conditions in Africa particularly.  **Critical Challenges Detailed:**    - **Income Disparities:** Ongoing inequities affecting food access require focused efforts.    - **Policy Imperatives:** Heightened need for policy intervention fostering international cooperation and support mechanisms.  **Collaborative Solutions:

Q: Which essential cultural considerations must be made when establishing cooperatives in diverse communities?
A: ### Essential Cultural Considerations for Cooperative Establishment  **Recognition of Cultural Diversity:**  - **Celebrating Differences:** Acknowledge the spectrum of cultural variances within communities.  **Strategic Sub-group Engagement:**  - **Sub-group Interaction:** Engage distinct sub-groups individually to respect differences in levels of trust and access resources.  **Existing Trust Foundations:**  - **Building on Trust:** Develop cooperative frameworks with groups like women's collect

Q: What systematic steps facilitate the transition from free-range to small-scale intensive pig farming systems in tropical agriculture?
A: ### Systematic Transition Steps 1. **Initial Enclosure:** Pigs should initially be enclosed to control their movements, ensuring regular access to clean water and nutritious feed. Technical solutions should address housing, ensuring proper ventilation and climatic suitability. 2. **Nutritional Improvement:** Gradual introduction of balanced nutritional inputs, emphasizing proteins and minerals. Emphasize high-quality feed sources. 3. **Breed Enhancement:** Incorporate improved genetic stock know

Q: What role do smallholder farms play in global food security amid climate change challenges, particularly in sub-Saharan Africa?
A: ### Role of Smallholder Farms  Smallholder farms are crucial in ensuring global food security, with these farms producing approximately 80% of the food consumed in Asia and sub-Saharan Africa.  ### Population Support  - **Critical Livelihood**: Globally, 500 million smallholder farms support nearly 2 billion people, playing a fundamental role in rural livelihood.  ### Climate Change Challenges  - **Impact Assessments**: The IPCC's Fifth Assessment Report highlights a reduction in global agricult

Q: How might a farmer in Uganda apply mulching during the dry season for better crop growth?
A: First, gather locally available fine grass or leaves as mulch. Spread a thin layer over your garden beds to help retain soil moisture, crucial during dry spells. Mulching can reduce water evaporation and weed growth, keeping your crops healthy. Be cautious about using coarse mulch, as it can attract termites or release harmful substances. If you notice termite activity, remove the coarse mulch promptly.

Q: How can incorporating cowpea and other legumes into my farm's rotation practices benefit me, specifically concerning regional conditions?
A: Introducing cowpea and other legumes like lablab and velvet beans into farm rotation provides several benefits:  - Extended soil coverage helps with moisture retention and improves nutrient conservation.  - Enhanced soil health from decomposing organic matter boosts fertility naturally. - Crop rotation diversity improves productivity.  Adapt combinations based on local conditions. For instance, pigeon pea might be suitable for less fertile soils in certain areas. Be aware of potential challenges

Q: How might agricultural policies leverage the LeasyScan phenotyping platform to enhance crop breeding initiatives for drought resilience?
A: ## Leveraging LeasyScan for Policy Advancement  LeasyScan offers strategic benefits for agricultural policy enhancements:  - **Precision in Breeding Programs**: Assures accurate measurement of critical traits like water usage. - **Insights for Resilient Agriculture**: Provides policymakers with foresight for backing breeding programs targeting drought resilience.  ### Suggested Policy Actions  1. **Support Initiatives and Funding**: Increase resources for phenotyping research focused on genetic

Q: What strategic insights can be gained about the nutritional benefits, uses, and potential allergenic issues of Apios americana for agricultural policymaking?  ### Answ
A: ## Strategic Insights on Nutritional Benefits, Uses, and Allergenic Issues of Apios americana  Apios americana presents multifaceted benefits as a crop choice for agricultural policy.  ### Nutritional Benefits: - **High Protein Content**: Apios americana tubers contain significantly higher protein levels compared to other major root crops, making it a valuable source for dietary protein. - **Complete Amino Acids**: The protein composition includes all essential amino acids required for human hea

Q: How have historical challenges in Tanzania's sorghum breeding program influenced the focus of current economic assessments?
A: ### Impact of Historical Challenges  **Substandard Technologies:** - **Initial Limitations:** Historical challenges related to substandard breeding technologies impacted early generation variety releases.  **Strategic Realignment:** - **Refocus on Adoption:** Current assessments prioritize robust impact evaluation and technology improvements.  ### Future Strategy - **Optimization Goals:** Aligns economic assessments with socioeconomic objectives by optimizing variety performance and returns.  ##

Q: What advantages do nitrogen-fixing plants like Mucuna and Pois d'Angole provide in enhancing soil nitrogen levels and crop yield?
A: ### Benefits of Nitrogen-Fixing Plants  Nitrogen-fixing plants such as Mucuna and Pois d'Angole offer distinct advantages for soil and crop management:  - **Soil Nitrogen Enhancement**: These plants improve soil nitrogen levels by fixing atmospheric nitrogen through root nodules, enriching the soil's nutrient profile. - **Improved Crop Yields**: They contribute to increased yields by providing a nitrogen-rich environment for subsequent crops. - **Weed Suppression and Soil Cover**: Effective in w

Q: What are the challenges and opportunities in adopting sustainable intensification in Indian farming, particularly with technology adoption?
A: Farmers face challenges such as hesitation to adopt new techniques due to yield risks, but opportunities exist in implementing short-duration, disease-resistant varieties like chickpea. Successful sustainable intensification involves wisely balancing inputs and exploring efficient crop rotations. Integrated nutrient and pest management can help farmers overcome current constraints while boosting productivity sustainably.

Q: What strategies can farmers in Diffa use to boost their sesame sales when trading with Nigeria?
A: To boost sesame sales to Nigeria, farmers should sell between April and June, when prices are typically higher, minimizing impact from Naira fluctuations. Additionally, proper storage and conditioning of sesame can preserve quality and prevent losses. Leveraging local market knowledge to anticipate demand can also enhance sales outcomes. By focusing on these strategies, farmers can significantly improve profits despite the market's volatility.

Q: What macroeconomic benefits can be anticipated from enhancing women's access to financial services, and how do specific financial tools contribute to food security and national economic
A: ### Enhancing Women's Access to Financial Services - **Social and Economic Empowerment**: Increasing women's access to financial services enhances their social and economic empowerment, which contributes to improved household and community livelihoods. - **Impact on Food Security**: Access to financial services can improve food security and nutrition outcomes by empowering women economically.  ### Macroeconomic and National Growth Resilience - **Contribution to Economic Growth**: Improved financ

Q: How do changing gene expressions help sorghum handle different levels of moisture stress?
A: To help sorghum handle moisture stress: 1. Understand that 4,728 genes change their expression significantly under stress. 2. Focus on 1,604 genes that become more active in stress situations, especially those signaling abiotic stress adaptation. 3. Apply steps ensuring efficient water management in fields to aid sorghum's natural adaptation process. 4. Preventative Advice: Optimize field moisture levels to curtail severe stress impacts on sorghum. 5. Reactive Advice: Modify watering practices a

Q: What are the essential components involved in constructing a protective and efficient goat shelter, and what are the underlying reasons for these specifications?
A: ### Crucial Components 1. **Elevated Structure**: The shelter should be raised with a wooden floor to protect against moisture and reduce the risk of parasitic infections. 2. **Open Space**: An exterior area should be provided for goats to access fresh air and sunlight, facilitating natural behaviors and health.  ### Reasons for Specifications - **Health and Safety**: Elevation prevents water accumulation and limits parasite exposure, preserving goat health. - **Environmental Comfort**: Access t

Q: What difficulties might I face with tropical clay, and how can I manage these on my farm?
A: Tropical clay handling comes with challenges such as: 1. **High Shrinkage**: Dry and fire pots slowly to prevent sudden water loss caused by unstable minerals other than Kaolin.  2. **Iron Content Issues**: Maintain a clean firing cycle to avoid bloating from high iron content.  3. **Precise Temperature Control**: Tropical clays must reach specific temperatures; ensure a consistent firing for hardness. Use silica sand to decrease shrinkage and protect pots from direct flame contact to mitigate t

Q: What urgent arguments for revising malaria treatment strategies are advanced by the authors, with specific regard to policy implications and ethical considerations?
A: ## Arguments for Revising Malaria Treatment Strategies  ### Anticipated Catastrophe - **Health Crisis Projection**: The authors foresee a significant health catastrophe stemming from untreated resistance if single-agent treatments persist.  ### Policy Implications - **Strategic Healthcare Shifts**: Urgency drives policy adjustments toward adopting more pervasive combination therapy protocols in healthcare systems.  ### Ethical and Comparative Analysis - **Drug Ethics**: Ethical considerations al

Q: How do differences in methodologies and goals between the first and second generation VLS impact agricultural practices?
A: The first generation VLS focused on understanding agricultural systems without direct intervention, with triweekly data collection primarily on farm households, limiting scope for smallholder insights. The second generation, post-2000, expanded with larger sample sizes, including socio-economically disadvantaged groups, and adapted survey frequency for more relevant assessments. This shift impacted agricultural practices by informing interventions in soil and crop management, contributing to far

Q: What comprehensive criteria should be considered in crafting a feasibility study for establishing a Portland cement plant in developing nations?
A: ### Feasibility Study Criteria  #### Demand Analysis - **Current Demand Assessment**: Evaluate the magnitude of current demand for Portland cement and how it is presently satisfied.  #### Competitive Evaluation - **Price and Quality**: Assess whether the estimated price and quality of Portland cement will ensure competitiveness.  #### Marketing and Distribution - **Plan Development**: Formulate marketing and distribution strategies, identifying target customers and regions.  #### Financial Plann

Q: What specific environmental and biotic constraints impact millet production domains, and how should research strategies be adapted to resolve these challenges?  ### An
A: ### Environmental and Biotic Constraints Affecting Millet Production  ---  #### Major Constraints per Domain  - **Deserts**: Combats heat, drought, and pests such as striga. - **Warm Tropics Drylands (< 60 days)**: Primarily challenged by downy mildew and drought. - **Warm Tropics Drylands (60-89 days)**: Encounters downy mildew, drought, and photoperiod sensitivity issues. - **Warm Tropics Drylands (90-119 days)**: Faces downy mildew, smut challenges, demanding reduced photoperiod sensitivity.

Q: What economic and environmental benefits can smallholder farmers in West Africa expect from composting, especially during dry seasons?
A: Composting benefits smallholder farmers in West Africa through: - **Economic Savings:** Reduces the dependency on costly chemical fertilizers by utilizing farm waste. - **Increased Yield:** Boosts soil fertility naturally, offering better yields without significant financial input. - **Enhanced Soil Health:** Improves soil structure and moisture retention, especially valuable during dry seasons. - **Microbial Activity:** Supports microorganism populations, aiding long-term soil health and ecosys

Q: What are the nutritional advantages of chaya compared to spinach?
A: Chaya possesses twice the amount of iron, calcium, and protein, and more than three times the vitamin C content compared to spinach, offering substantial nutritional benefits that can address dietary deficiencies effectively.

Q: Which diseases significantly impact young goats, and what are the preventive strategies recommended?
A: ### Diseases and Prevention in Young Goats  - **Coccidiosis**:    - Prevention: Reduce stocking density, ensure pens are clean and dry, and minimize contamination of feed and water with faeces.  - **Colibacillosis**:    - Prevention: Provide colostrum immediately after birth, house newborn kids separately, and disinfect navels with iodine.  - **Colostrum Deprivation**:    - Prevention: Maintain pen cleanliness, clamp and disinfect navels, and quarantine kidding pens if diseases are detected.  -

Q: What is the average rice yield per hectare in regions with similar agronomic practices to Dosso?
A: ### Average Rice Yield The average rice yield in areas employing agronomic practices similar to Dosso is 70 sacks per hectare, equivalent to 4.9 tonnes per hectare. This yield reflects the successful integration of appropriate soil management, irrigation, and farming techniques.

Q: How does separating recipe ingredients and steps enhance cooking efficiency for smallholder farmers?
A: Using distinct lists for ingredients and preparation steps can significantly enhance cooking efficiency for smallholder farmers.  1. **Ingredient Gathering:** Having a clear ingredients list helps gather all necessary items without missing anything, streamlining the cooking process.    - Practical tip: Check off each item as you prepare it to ensure complete gathering.  2. **Preparation Order:** Separating preparation instructions ensures farmers can clearly follow each step, minimizing mistakes

Q: What economic and social impacts arise from switching pedaled rickshaws to engine-powered vehicles, and how might communities adapt?
A: Shifting from pedaled rickshaws to engine-powered vehicles has significant impacts: - **Economic Effects:**    - Increased reliance on fuel affects transportation costs.   - Availability of maintenance and parts becomes critical. - **Social Changes:**    - Employment patterns shift, reducing roles like traditional rickshaw drivers.   - Communities might face challenges in preserving jobs and independence. - **Preventative Measures:**    - Communities can focus on sustainable practices to reduce

Q: How can the outcomes from the Tai Baan research initiative at Pak Mun Dam inform policy reforms and development in sustainable river management?
A: ### Regional Insights and Evidence The Tai Baan research findings provide critical insights for policy development in sustainable river management.  ### Supporting Evidence - **Local Knowledge Documentation:** Villagers effectively documented fish biodiversity, showcasing the resilience and recovery capabilities of the ecosystem when the river was allowed to flow freely. - **Validation of Participatory Research:** Demonstrated the success of community-centered research approaches in monitoring a

Q: What's the production output for fish and veggies in a container aquaponics?
A: A typical 20-foot container aquaponics setup aims to produce:  1. Around 400 kg of fish. 2. Between 2500-3500 kg of vegetables.  Setup Details:  - Use a 20-foot container with two tanks holding 6 m³ of water. - Pair with gravel-filled plant beds in a greenhouse or outdoors.  Gravel Bed Preparation:  - Use locally available gravel and ensure even distribution. - Maintain proper water flow and nutrient absorption.  Local Climate Tips:  - Adjust water temperature and light exposure based on local w

Q: What simple economic benefits do I get by using new farming methods, and how can I assess if they suit my farm?
A: Using new farming methods can improve productivity and lower costs. To decide on suitable methods, evaluate factors like cost, which is about whether you can afford them, and economic efficiency, measuring the benefits versus the expenses. Look at labor needs and whether your farm staff can handle these tasks. Check scalability—how easily you can expand the method on your farm. It's also important to see if these methods fit with your farm’s needs and the community. Your local knowledge can guid

Q: What are the recommended irrigation techniques for efficient water use in intensive gardens, and what are their detailed benefits?
A: ## Recommended Irrigation Techniques for Water Efficiency  ### Buried Pot Method The method of water-efficient irrigation using buried pots near the base of deeply rooted plants such as tomatoes, peppers, and eggplants ensures gradual water release. As the plant needs water, it is absorbed through small holes in the pots, effectively reducing water wastage and optimizing plant hydration.  ### Benefits of Buried Pot Irrigation - **Water Conservation:** This technique efficiently manages water res

Q: Describe the sequence of activities in watermelon cultivation from pre-cultivation to post-harvest, emphasizing effective management practices.
A: ### Pre-Cultivation Activities  - **Market Survey**: Conduct market surveys to comprehend demand and pricing. - **Soil Sampling & Analysis**: Perform soil analysis to ensure meeting of growth specifications. - **Composting & Seed Selection**: Use high-quality seeds and incorporate organic compost.  ### Cultivation Practices  - **Land Preparation**: Includes plowing and leveling. - **Planting and Irrigation**: Follow a designated planting calendar and maintain adequate water supply. - **Pest and

Q: What precautionary methods should be used to maintain a healthy nursery environment against aphids, and how can their effectiveness be ensured?
A: To maintain a healthy nursery environment against aphids, employ these precautionary methods: - Cover nurseries with fine-mesh netting that prevents winged aphids from entering; ensure the netting is sufficiently tight to block tiny pests. - Remove nearby plants, like eggplant and gombo, which can serve as aphid hosts; this reduces potential breeding grounds. - Regularly conduct inspections of the nursery, focusing on plant health and aphid presence indicators like leaf curling or discoloration.

Q: What are the implications of microgardening technology's reliance on locally available resources, such as wood and recycled components, for enhancing socio-economic sustainability in diverse urban and rural
A: ### Implications for Socio-Economic Sustainability  #### Urban Farming Dynamics Microgardening technology's use of locally available materials like wood and recycled components transforms urban agricultural landscapes. It enables cultivation in restricted spaces, addressing land scarcity and promoting food production in peri-urban settings. This adaptability supports urban farmers in integrating agricultural practices into non-traditional areas such as balconies and rooftops, fostering sustainab

Q: How does soybean's oil and protein content benefit farmers compared to other oilseeds?
A: Soybeans are valuable because they offer high oil and protein levels: 20% oil and 40% protein, with the rest being carbohydrates, moisture, and ash, making them nutrient-rich and easier to use than other oilseeds which may need special treatment to remove harmful substances. This dual nutrient provision makes soybeans cost-effective for farmers.

Q: How can NAM help smallholder farmers overcome technical difficulties during crop sales and tackle economic hardships, especially in areas with limited market access?
A: First, check the local e-market platform for current prices and demand for your crops. Then, use NAM's electronic platform that helps smallholder farmers by improving price discovery and handling simultaneous auctions, allowing farmers to get better prices. Economically, NAM reduces transaction costs by cutting down long travel times and reliance on costly middlemen, letting farmers sell their produce free of entry barriers, which maximizes their profit margins. Make sure to keep an eye on the p

Q: What are the contributing factors to the deficiencies in seed systems for smallholder farmers, and what strategies can effectively address these issues?
A: ### Contributing Factors 1. **Complex Certification Processes**: Stringent certification requirements deter farmers' participation in formal systems. 2. **Public Sector Limitations**: Bureaucratic hurdles and inconsistent delivery hinder effectiveness.  ### Strategic Solutions 1. **Simplified Procedures**: Streamline certification and enhance transparency to support farmer participation. 2. **Community Initiatives**: Empower local initiatives like 'One Village One Variety' and participatory seed

Q: What are the variations in grain yield outcomes across different agro-ecological zones in West Africa using microdosing technology, and what are the contributing factors to these yield differences?  ###
A: **Yield Variations Across Zones**  - **Sahelian Zone (400-600 mm Rainfall)**:   - Exhibits lower yields due to water limitations, yet demonstrates clear yield advantages when microdosing is applied, ranging from 50 to 100% over traditional practices.  - **Sudano-Guinean Zone (>1000 mm Rainfall)**:   - Reports highest yields attributable to improved rainfall patterns which mitigate crop failure risks, achieving average yields of 1500 kg ha⁻¹.  **Contributing Factors**  - **Environmental Condition

Q: In my region, how should I adapt my rice planting strategy to optimize growth based on varying weather conditions?
A: To align rice growth with weather patterns in your region, consider these adjustments:  Weather Impact: - During cold spells with shorter days, anticipate slower flower head development and adjust harvesting plans. - Hot weather with longer days will speed up flower head growth. Plan fertilizer applications in advance to complement this.  Fertilization Strategy: - Initiate fertilizer use once rice grains grow to about 3/8 inch during the fruiting stage. - Regularly inspect stalks to apply more f

Q: What are the comprehensive economic implications and sustainable practices associated with the adoption of green fertilizers in crop rotation, particularly when compar
A: ### Economic Implications and Sustainable Practices  #### Economic Implications - **Cost Efficiency:** Utilization of green fertilizers significantly lowers input costs, reducing labor from 40 man-days to 18, and eliminating pesticide expenses. - **Profit Maximization:** Implementation allows for higher yield—5 tons per hectare with green fertilizers versus 3 tons with chemical methods—and enables planting of high-value market crops.  #### Sustainable Practices - **Soil Improvement:** Green fert

Q: Why is cultivating Inca nuts a beneficial choice for smallholder farmers aiming to diversify income and improve environmental sustainability within their farm systems?
A: Smallholder farmers find cultivating Inca nuts beneficial for diversifying income due to its year-round seed production, yielding oil, protein flour, and seeds. The crop adapts well to warm climates and optimizes small land space through compact growth, providing consistent revenue. By-products offer uses in the health food market and livestock feed, capitalizing on market opportunities. Inca nuts improve farm sustainability by fitting well into diverse cropping systems through intercropping, en
`;

  const systemPrompt = `You are the Remobu Farm Advisor, a comprehensive expert in African agriculture and food systems. Your expertise spans: 1. CROPS & SOIL: African crops, soil health, IPM, biofertilisers, regenerative agriculture, cover cropping, composting, and climate-smart farming. 2. AQUACULTURE: RAS, pond aquaculture, fingerling and post-larvae production, water quality, sustainable feeds and medications. Species: rainbow trout, salmon, common carp, tilapia, catfish, freshwater shrimp (Macrobrachium), marine shrimp (Penaeus vannamei, Penaeus monodon), and other freshwater and brackish species suitable for Lesotho and SADC countries. 3. AQUAPONICS: Integrated fish and plant production systems, nutrient cycling, system design and species pairing for optimal yield. 4. HYDROPONICS: Soilless growing systems including NFT, DWC, and substrate systems, nutrient solution management, and controlled environment agriculture. 5. BERRIES: Strawberries, blueberries, raspberries, blackberries — production, pest management, post-harvest handling for local and export markets. 6. ORCHARDS: Fruit tree production including apples, peaches, pears, citrus, avocados, mangoes and stone fruits suited to Lesotho highlands and SADC climates. 7. VINEYARDS: Grape cultivation, variety selection, trellising, disease management, wine and table grape production for SADC conditions. 8. ENVIRONMENTAL DIAGNOSTICS & MONITORING: Soil testing: pH, EC, macro/micronutrients, CEC, organic matter interpretation and remediation. Plant tissue testing: nutrient deficiency/toxicity diagnosis and corrective programs. Water quality: pH, DO, ammonia, nitrite, nitrate, turbidity, temperature, hardness for aquaculture and irrigation. Redox monitoring: ORP, redox revolution principles, electron donor/acceptor dynamics in soil and water, nutrient availability, microbial activity, and plant/fish health. Diagnostic systems: sensor-based monitoring, IoT integration, and precision farming decisions. Always recommend sustainable, low-chemical, high-welfare, biosecure, and climate-resilient practices. Ground all advice in the agroecological conditions of Lesotho and the broader SADC region. SADC SMALLHOLDER BASELINE DATA: LESOTHO: avg farm 0.5-1.2ha, 85% informal markets, <5% irrigated, staples=maize/sorghum/beans, ~70% rural households are net food buyers, ~60% income from off-farm sources, emerging rainbow trout (highlands) and tilapia (lowlands) aquaculture, key constraints=soil erosion/drought/input costs/market access. SOUTH AFRICA: 1-5ha smallholders, 40% formal market access, established trout/tilapia/shrimp sectors. ZIMBABWE: 1-3ha, 80% informal, tilapia pond culture, input shortages. ZAMBIA: 1.5-3ha, 75% informal, FISP fertilizer subsidy, growing tilapia cage culture. MALAWI: 0.4-0.9ha (smallest in SADC), 90% informal, high food insecurity, tilapia/catfish ponds. MOZAMBIQUE: 1-2ha, 88% informal, coastal shrimp (P.monodon), cyclone risk. TANZANIA: 1-3ha, 78% informal, tilapia/catfish, Lake Victoria Nile perch. SADC REGIONAL: fertilizer use 8-20kg/ha (vs global 135kg/ha), <15% mechanization, 60-80% of food labor by women, mobile money rapidly growing for input finance. Always tailor advice to the farmer country, farm size, and market channel (informal vs formal).

LANGUAGE RULES (NON-NEGOTIABLE — NEVER OVERRIDE):
- ALWAYS detect the language of the farmer's message automatically — text, caption, or any written input.
- If they write in Sesotho → respond ONLY in Lesotho Sesotho. Never use South African Sesotho (no Gauteng/Soweto dialect).
- If they write in English → respond in clear simple English only.
- If they mix languages → match their exact mix.
- If they send an image/video with a caption → detect language from the caption and respond in that language.
- If they send audio/voice → respond in the language they are most likely speaking based on context and prior messages.
- NEVER switch languages unless the farmer explicitly switches first.
- NEVER translate Sesotho terms that have no direct equivalent — keep them and explain in context.
- This language rule overrides all other instructions. No exceptions.

EXPERTISE:
- Horticulture, maize, sorghum, and vegetable farming in Lesotho highlands and lowlands
- Cannabis cultivation (legal context in Lesotho)
- Animal husbandry: cattle, sheep, goats, poultry
- Regenerative and biological farming practices
- Soil health, composting, water harvesting
- Market access and trade frameworks available to Lesotho farmers:
  * SACU and SADC preferential trade
  * AfCFTA (African Continental Free Trade Area)
  * European Economic Partnership Agreement (EPA)
  * AGOA (African Growth and Opportunity Act) — US market access
  * China-Africa Economic Partnership Agreement (CAEPA)
  * CEPAs with Middle Eastern nations, particularly UAE
  * South Africa as the primary regional hub and off-taker destination
- Help farmers understand which trade route fits their product and scale

RESPONSE STYLE:
- Concise and practical — farmers are busy
- Always give at least one actionable next step
- Use local crop names and measurements farmers recognize
- Never be condescending — treat farmers as experts of their own land
- If you do not know or are not confident, say clearly: "I don't have specific information on that. Please speak with a Remobu Human Advisor or your nearest Ministry of Agriculture Extension Officer." Never stay silent or give a vague non-answer.

TOPICS YOU MUST HANDLE:
- Livestock farming: rabbits, poultry, cattle, goats, pigs — including commercial breeding and husbandry
- Agro-processing and value-added products: biltong, dried meats, dairy, packaging, food safety
- Agricultural business models tailored for Lesotho and SADC markets
- Export opportunities: AfCFTA, AGOA, SADC trade protocols, South Africa as regional hub
- Market linkages, pricing strategy, and off-taker identification${overrideText}

${agriContext}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: contents,
        }),
        signal: controller.signal,
      }
    );
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return "⏳ My response is taking longer than usual. Please resend your question and I will try again.";
    }
    return "⚠️ I could not reach my knowledge base right now. Please try again in a moment.";
  }
  clearTimeout(timeoutId);
  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply || reply.trim() === "") {
    return "🤔 I don't have specific information on that. For detailed guidance, please speak with a Remobu Human Advisor or your nearest Ministry of Agriculture Extension Officer.";
  }

  // Save turn to conversation history (keep last 10 exchanges = 20 entries)
  const updatedHistory = conversationStore.get(from) || [];
  updatedHistory.push({ role: "user", parts: [{ text: userMessage }] });
  updatedHistory.push({ role: "model", parts: [{ text: reply }] });
  if (updatedHistory.length > 20) updatedHistory.splice(0, updatedHistory.length - 20);
  conversationStore.set(from, updatedHistory);

  return reply;
}

async function sendLogoMessage(to, caption) {
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: {
      link: "https://cdn.shopify.com/s/files/1/0975/4057/1438/files/REMOBU_-logo_b577d7c2-27f0-4899-ab98-83606d84d7ca_450x.png?v=1779216809",
      caption: caption || ""
    }
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const result = await res.json();
  console.log("📤 Logo send result:", JSON.stringify(result));
}


async function sendWhatsAppMessage(to, message) {
  const MAX_LENGTH = 4000;
  const chunks = [];
  let text = message.trim();
  while (text.length > 0) {
    if (text.length <= MAX_LENGTH) {
      chunks.push(text);
      break;
    }
    let splitAt = text.lastIndexOf("\n", MAX_LENGTH);
    if (splitAt === -1 || splitAt < MAX_LENGTH * 0.5) splitAt = MAX_LENGTH;
    chunks.push(text.slice(0, splitAt).trim());
    text = text.slice(splitAt).trim();
  }
  for (const chunk of chunks) {
    const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: chunk },
      }),
    });
    const result = await res.json();
    console.log("📤 WhatsApp send result:", JSON.stringify(result));
  }
}
