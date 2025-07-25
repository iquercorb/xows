/*
 * @licstart
 *                    X.O.W.S - XMPP Over WebSocket
 *                          ____       ____
 *                          \   \     /   /
 *                           \    \_/    /
 *                      .   .-           -.   .
 *                     /|  /   -.     .-   \  |\
 *                    | \_/  |___\   /___|  \_/ |
 *                    .                         .
 *                     \.__       ___       __./
 *                         /     /   \     \
 *                        /_____/     \_____\
 *
 *                     Copyright (c) 2022 Eric M.
 *
 *     This file is part of X.O.W.S (XMPP Over WebSocket Library).
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source
 *
 * @licend
 */
"use strict";
/* ------------------------------------------------------------------
 *
 *                      DOM Templates API Module
 *
 * ------------------------------------------------------------------ */

const XOWS_TPL_NONE       = 0;
const XOWS_TPL_IMPORT     = 1;
const XOWS_TPL_INSTANCED  = 2;

/**
 * Private parser for HTML parsing from string
 */
const xows_tpl_template_parser = new DOMParser();

/**
 * Callback function called once templates successfully loaded
 */
let xows_tpl_fw_onready = function() {};

/**
 * Stored remaining template loading
 */
let xows_tpl_template_parse_remain = 0;

/**
 * Stored instantiable templates list
 */
let xows_tpl_model = [];

/**
 * Temporary variable used to store template document root during
 * loading and parsing job
 */
let xows_tpl_fragment = null;

/**
 * Template URL theme folder to get template files. Finale path is
 * built as follow: <root>/themes/<theme>/<template_name>.html
 */
let xows_tpl_theme = "dark";

/**
 * Emojis short code to unicode map
 */
const xows_tpl_emoji_sc_map = {
  "100":"1F4AF","1234":"1F522","grinning":"1F600","smiley":"1F603","smile":"1F604","grin":"1F601","laughing":"1F606","sweat_smile":"1F605","rolling_on_the_floor_laughing":"1F923","joy":"1F602","slightly_smiling_face":"1F642","upside_down_face":"1F643","wink":"1F609","blush":"1F60A","innocent":"1F607","smiling_face_with_3_hearts":"1F970",
  "heart_eyes":"1F60D","star-struck":"1F929","kissing_heart":"1F618","kissing":"1F617","kissing_closed_eyes":"1F61A","kissing_smiling_eyes":"1F619","yum":"1F60B","stuck_out_tongue":"1F61B","stuck_out_tongue_winking_eye":"1F61C","zany_face":"1F92A","stuck_out_tongue_closed_eyes":"1F61D","money_mouth_face":"1F911","hugging_face":"1F917",
  "face_with_hand_over_mouth":"1F92D","shushing_face":"1F92B","thinking_face":"1F914","zipper_mouth_face":"1F910","face_with_raised_eyebrow":"1F928","neutral_face":"1F610","expressionless":"1F611","no_mouth":"1F636","smirk":"1F60F","unamused":"1F612","face_with_rolling_eyes":"1F644","grimacing":"1F62C","lying_face":"1F925","relieved":"1F60C",
  "pensive":"1F614","sleepy":"1F62A","drooling_face":"1F924","sleeping":"1F634","mask":"1F637","face_with_thermometer":"1F912","face_with_head_bandage":"1F915","nauseated_face":"1F922","face_vomiting":"1F92E","sneezing_face":"1F927","hot_face":"1F975","cold_face":"1F976","woozy_face":"1F974","dizzy_face":"1F635","exploding_head":"1F92F",
  "face_with_cowboy_hat":"1F920","partying_face":"1F973","sunglasses":"1F60E","nerd_face":"1F913","face_with_monocle":"1F9D0","confused":"1F615","worried":"1F61F","slightly_frowning_face":"1F641","open_mouth":"1F62E","hushed":"1F62F","astonished":"1F632","flushed":"1F633","pleading_face":"1F97A","frowning":"1F626","anguished":"1F627",
  "fearful":"1F628","cold_sweat":"1F630","disappointed_relieved":"1F625","cry":"1F622","sob":"1F62D","scream":"1F631","confounded":"1F616","persevere":"1F623","disappointed":"1F61E","sweat":"1F613","weary":"1F629","tired_face":"1F62B","yawning_face":"1F971","triumph":"1F624","rage":"1F621","angry":"1F620","face_with_symbols_on_mouth":"1F92C",
  "smiling_imp":"1F608","imp":"1F47F","skull":"1F480","hankey":"1F4A9","clown_face":"1F921","japanese_ogre":"1F479","japanese_goblin":"1F47A","ghost":"1F47B","alien":"1F47D","space_invader":"1F47E","robot_face":"1F916","smiley_cat":"1F63A","smile_cat":"1F638","joy_cat":"1F639","heart_eyes_cat":"1F63B","smirk_cat":"1F63C","kissing_cat":"1F63D",
  "scream_cat":"1F640","crying_cat_face":"1F63F","pouting_cat":"1F63E","see_no_evil":"1F648","hear_no_evil":"1F649","speak_no_evil":"1F64A","kiss":"1F48B","love_letter":"1F48C","cupid":"1F498","gift_heart":"1F49D","sparkling_heart":"1F496","heartpulse":"1F497","heartbeat":"1F493","revolving_hearts":"1F49E","two_hearts":"1F495","heart_decoration":"1F49F",
  "broken_heart":"1F494","orange_heart":"1F9E1","yellow_heart":"1F49B","green_heart":"1F49A","blue_heart":"1F499","purple_heart":"1F49C","brown_heart":"1F90E","black_heart":"1F5A4","white_heart":"1F90D","anger":"1F4A2","boom":"1F4A5","dizzy":"1F4AB","sweat_drops":"1F4A6","dash":"1F4A8","bomb":"1F4A3","speech_balloon":"1F4AC","thought_balloon":"1F4AD",
  "zzz":"1F4A4","wave":"1F44B","raised_back_of_hand":"1F91A","hand":"270B","spock-hand":"1F596","ok_hand":"1F44C","pinching_hand":"1F90F","crossed_fingers":"1F91E","i_love_you_hand_sign":"1F91F","the_horns":"1F918","call_me_hand":"1F919","point_left":"1F448","point_right":"1F449","point_up_2":"1F446","middle_finger":"1F595","point_down":"1F447",
  "+1":"1F44D","-1":"1F44E","fist":"270A","facepunch":"1F44A","left-facing_fist":"1F91B","right-facing_fist":"1F91C","clap":"1F44F","raised_hands":"1F64C","open_hands":"1F450","palms_up_together":"1F932","handshake":"1F91D","pray":"1F64F","nail_care":"1F485","selfie":"1F933","muscle":"1F4AA","mechanical_arm":"1F9BE","mechanical_leg":"1F9BF","leg":"1F9B5",
  "foot":"1F9B6","ear":"1F442","ear_with_hearing_aid":"1F9BB","nose":"1F443","brain":"1F9E0","tooth":"1F9B7","bone":"1F9B4","eyes":"1F440","tongue":"1F445","lips":"1F444","baby":"1F476","child":"1F9D2","boy":"1F466","girl":"1F467","adult":"1F9D1","person_with_blond_hair":"1F471","man":"1F468","bearded_person":"1F9D4","woman":"1F469","older_adult":"1F9D3",
  "older_man":"1F474","older_woman":"1F475","person_frowning":"1F64D","person_with_pouting_face":"1F64E","no_good":"1F645","ok_woman":"1F646","information_desk_person":"1F481","raising_hand":"1F64B","deaf_person":"1F9CF","bow":"1F647","face_palm":"1F926","shrug":"1F937","cop":"1F46E","guardsman":"1F482","construction_worker":"1F477","prince":"1F934",
  "princess":"1F478","man_with_turban":"1F473","man_with_gua_pi_mao":"1F472","person_with_headscarf":"1F9D5","man_in_tuxedo":"1F935","bride_with_veil":"1F470","pregnant_woman":"1F930","breast-feeding":"1F931","angel":"1F47C","santa":"1F385","mrs_claus":"1F936","superhero":"1F9B8","supervillain":"1F9B9","mage":"1F9D9","fairy":"1F9DA","vampire":"1F9DB",
  "merperson":"1F9DC","elf":"1F9DD","genie":"1F9DE","zombie":"1F9DF","massage":"1F486","haircut":"1F487","walking":"1F6B6","standing_person":"1F9CD","kneeling_person":"1F9CE","runner":"1F3C3","dancer":"1F483","man_dancing":"1F57A","dancers":"1F46F","person_in_steamy_room":"1F9D6","person_climbing":"1F9D7","fencer":"1F93A","horse_racing":"1F3C7",
  "snowboarder":"1F3C2","surfer":"1F3C4","rowboat":"1F6A3","swimmer":"1F3CA","bicyclist":"1F6B4","mountain_bicyclist":"1F6B5","person_doing_cartwheel":"1F938","wrestlers":"1F93C","water_polo":"1F93D","handball":"1F93E","juggling":"1F939","person_in_lotus_position":"1F9D8","bath":"1F6C0","sleeping_accommodation":"1F6CC","two_women_holding_hands":"1F46D",
  "couple":"1F46B","two_men_holding_hands":"1F46C","couplekiss":"1F48F","couple_with_heart":"1F491","family":"1F46A","bust_in_silhouette":"1F464","busts_in_silhouette":"1F465","footprints":"1F463","monkey_face":"1F435","monkey":"1F412","gorilla":"1F98D","orangutan":"1F9A7","dog":"1F436","dog2":"1F415","guide_dog":"1F9AE","poodle":"1F429","wolf":"1F43A",
  "fox_face":"1F98A","raccoon":"1F99D","cat":"1F431","cat2":"1F408","lion_face":"1F981","tiger":"1F42F","tiger2":"1F405","leopard":"1F406","horse":"1F434","racehorse":"1F40E","unicorn_face":"1F984","zebra_face":"1F993","deer":"1F98C","cow":"1F42E","ox":"1F402","water_buffalo":"1F403","cow2":"1F404","pig":"1F437","pig2":"1F416","boar":"1F417",
  "pig_nose":"1F43D","ram":"1F40F","sheep":"1F411","goat":"1F410","dromedary_camel":"1F42A","camel":"1F42B","llama":"1F999","giraffe_face":"1F992","elephant":"1F418","rhinoceros":"1F98F","hippopotamus":"1F99B","mouse":"1F42D","mouse2":"1F401","rat":"1F400","hamster":"1F439","rabbit":"1F430","rabbit2":"1F407","hedgehog":"1F994","bat":"1F987","bear":"1F43B",
  "koala":"1F428","panda_face":"1F43C","sloth":"1F9A5","otter":"1F9A6","skunk":"1F9A8","kangaroo":"1F998","badger":"1F9A1","feet":"1F43E","turkey":"1F983","chicken":"1F414","rooster":"1F413","hatching_chick":"1F423","baby_chick":"1F424","hatched_chick":"1F425","bird":"1F426","penguin":"1F427","eagle":"1F985","duck":"1F986","swan":"1F9A2","owl":"1F989",
  "flamingo":"1F9A9","peacock":"1F99A","parrot":"1F99C","frog":"1F438","crocodile":"1F40A","turtle":"1F422","lizard":"1F98E","snake":"1F40D","dragon_face":"1F432","dragon":"1F409","sauropod":"1F995","t-rex":"1F996","whale":"1F433","whale2":"1F40B","dolphin":"1F42C","fish":"1F41F","tropical_fish":"1F420","blowfish":"1F421","shark":"1F988","octopus":"1F419",
  "shell":"1F41A","snail":"1F40C","butterfly":"1F98B","bug":"1F41B","ant":"1F41C","bee":"1F41D","beetle":"1F41E","cricket":"1F997","scorpion":"1F982","mosquito":"1F99F","microbe":"1F9A0","bouquet":"1F490","cherry_blossom":"1F338","white_flower":"1F4AE","rose":"1F339","wilted_flower":"1F940","hibiscus":"1F33A","sunflower":"1F33B","blossom":"1F33C",
  "tulip":"1F337","seedling":"1F331","evergreen_tree":"1F332","deciduous_tree":"1F333","palm_tree":"1F334","cactus":"1F335","ear_of_rice":"1F33E","herb":"1F33F","four_leaf_clover":"1F340","maple_leaf":"1F341","fallen_leaf":"1F342","leaves":"1F343","grapes":"1F347","melon":"1F348","watermelon":"1F349","tangerine":"1F34A","lemon":"1F34B","banana":"1F34C",
  "pineapple":"1F34D","mango":"1F96D","apple":"1F34E","green_apple":"1F34F","pear":"1F350","peach":"1F351","cherries":"1F352","strawberry":"1F353","kiwifruit":"1F95D","tomato":"1F345","coconut":"1F965","avocado":"1F951","eggplant":"1F346","potato":"1F954","carrot":"1F955","corn":"1F33D","cucumber":"1F952","leafy_green":"1F96C","broccoli":"1F966",
  "garlic":"1F9C4","onion":"1F9C5","mushroom":"1F344","peanuts":"1F95C","chestnut":"1F330","bread":"1F35E","croissant":"1F950","baguette_bread":"1F956","pretzel":"1F968","bagel":"1F96F","pancakes":"1F95E","waffle":"1F9C7","cheese_wedge":"1F9C0","meat_on_bone":"1F356","poultry_leg":"1F357","cut_of_meat":"1F969","bacon":"1F953","hamburger":"1F354",
  "fries":"1F35F","pizza":"1F355","hotdog":"1F32D","sandwich":"1F96A","taco":"1F32E","burrito":"1F32F","stuffed_flatbread":"1F959","falafel":"1F9C6","egg":"1F95A","fried_egg":"1F373","shallow_pan_of_food":"1F958","stew":"1F372","bowl_with_spoon":"1F963","green_salad":"1F957","popcorn":"1F37F","butter":"1F9C8","salt":"1F9C2","canned_food":"1F96B",
  "bento":"1F371","rice_cracker":"1F358","rice_ball":"1F359","rice":"1F35A","curry":"1F35B","ramen":"1F35C","spaghetti":"1F35D","sweet_potato":"1F360","oden":"1F362","sushi":"1F363","fried_shrimp":"1F364","fish_cake":"1F365","moon_cake":"1F96E","dango":"1F361","dumpling":"1F95F","fortune_cookie":"1F960","takeout_box":"1F961","crab":"1F980","lobster":"1F99E",
  "shrimp":"1F990","squid":"1F991","oyster":"1F9AA","icecream":"1F366","shaved_ice":"1F367","ice_cream":"1F368","doughnut":"1F369","cookie":"1F36A","birthday":"1F382","cake":"1F370","cupcake":"1F9C1","pie":"1F967","chocolate_bar":"1F36B","candy":"1F36C","lollipop":"1F36D","custard":"1F36E","honey_pot":"1F36F","baby_bottle":"1F37C","glass_of_milk":"1F95B",
  "coffee":"2615","tea":"1F375","sake":"1F376","champagne":"1F37E","wine_glass":"1F377","cocktail":"1F378","tropical_drink":"1F379","beer":"1F37A","beers":"1F37B","clinking_glasses":"1F942","tumbler_glass":"1F943","cup_with_straw":"1F964","beverage_box":"1F9C3","mate_drink":"1F9C9","ice_cube":"1F9CA","chopsticks":"1F962","fork_and_knife":"1F374",
  "spoon":"1F944","hocho":"1F52A","amphora":"1F3FA","eyeglasses":"1F453","goggles":"1F97D","lab_coat":"1F97C","safety_vest":"1F9BA","necktie":"1F454","shirt":"1F455","jeans":"1F456","scarf":"1F9E3","gloves":"1F9E4","coat":"1F9E5","socks":"1F9E6","dress":"1F457","kimono":"1F458","sari":"1F97B","one-piece_swimsuit":"1FA71","briefs":"1FA72",
  "shorts":"1FA73","bikini":"1F459","womans_clothes":"1F45A","purse":"1F45B","handbag":"1F45C","pouch":"1F45D","school_satchel":"1F392","mans_shoe":"1F45E","athletic_shoe":"1F45F","hiking_boot":"1F97E","womans_flat_shoe":"1F97F","high_heel":"1F460","sandal":"1F461","ballet_shoes":"1FA70","boot":"1F462","crown":"1F451","womans_hat":"1F452",
  "tophat":"1F3A9","mortar_board":"1F393","billed_cap":"1F9E2","prayer_beads":"1F4FF","lipstick":"1F484","ring":"1F48D","gem":"1F48E","mute":"1F507","speaker":"1F508","sound":"1F509","loud_sound":"1F50A","loudspeaker":"1F4E2","mega":"1F4E3","postal_horn":"1F4EF","bell":"1F514","no_bell":"1F515","musical_score":"1F3BC","musical_note":"1F3B5",
  "notes":"1F3B6","microphone":"1F3A4","headphones":"1F3A7","radio":"1F4FB","saxophone":"1F3B7","guitar":"1F3B8","musical_keyboard":"1F3B9","trumpet":"1F3BA","violin":"1F3BB","banjo":"1FA95","drum_with_drumsticks":"1F941","iphone":"1F4F1","calling":"1F4F2","telephone_receiver":"1F4DE","pager":"1F4DF","fax":"1F4E0","battery":"1F50B","electric_plug":"1F50C",
  "computer":"1F4BB","minidisc":"1F4BD","floppy_disk":"1F4BE","cd":"1F4BF","dvd":"1F4C0","abacus":"1F9EE","movie_camera":"1F3A5","clapper":"1F3AC","tv":"1F4FA","camera":"1F4F7","camera_with_flash":"1F4F8","video_camera":"1F4F9","vhs":"1F4FC","mag":"1F50D","mag_right":"1F50E","bulb":"1F4A1","flashlight":"1F526","izakaya_lantern":"1F3EE","diya_lamp":"1FA94",
  "notebook_with_decorative_cover":"1F4D4","closed_book":"1F4D5","book":"1F4D6","green_book":"1F4D7","blue_book":"1F4D8","orange_book":"1F4D9","books":"1F4DA","notebook":"1F4D3","ledger":"1F4D2","page_with_curl":"1F4C3","scroll":"1F4DC","page_facing_up":"1F4C4","newspaper":"1F4F0","bookmark_tabs":"1F4D1","bookmark":"1F516","moneybag":"1F4B0","yen":"1F4B4",
  "dollar":"1F4B5","euro":"1F4B6","pound":"1F4B7","money_with_wings":"1F4B8","credit_card":"1F4B3","receipt":"1F9FE","chart":"1F4B9","currency_exchange":"1F4B1","heavy_dollar_sign":"1F4B2","e-mail":"1F4E7","incoming_envelope":"1F4E8","envelope_with_arrow":"1F4E9","outbox_tray":"1F4E4","inbox_tray":"1F4E5","package":"1F4E6","mailbox":"1F4EB",
  "mailbox_closed":"1F4EA","mailbox_with_mail":"1F4EC","mailbox_with_no_mail":"1F4ED","postbox":"1F4EE","memo":"1F4DD","briefcase":"1F4BC","file_folder":"1F4C1","open_file_folder":"1F4C2","date":"1F4C5","calendar":"1F4C6","card_index":"1F4C7","chart_with_upwards_trend":"1F4C8","chart_with_downwards_trend":"1F4C9","bar_chart":"1F4CA","clipboard":"1F4CB",
  "pushpin":"1F4CC","round_pushpin":"1F4CD","paperclip":"1F4CE","straight_ruler":"1F4CF","triangular_ruler":"1F4D0","lock":"1F512","unlock":"1F513","lock_with_ink_pen":"1F50F","closed_lock_with_key":"1F510","key":"1F511","hammer":"1F528","axe":"1FA93","gun":"1F52B","bow_and_arrow":"1F3F9","wrench":"1F527","nut_and_bolt":"1F529","probing_cane":"1F9AF",
  "link":"1F517","toolbox":"1F9F0","magnet":"1F9F2","test_tube":"1F9EA","petri_dish":"1F9EB","dna":"1F9EC","microscope":"1F52C","telescope":"1F52D","satellite_antenna":"1F4E1","syringe":"1F489","drop_of_blood":"1FA78","pill":"1F48A","adhesive_bandage":"1FA79","stethoscope":"1FA7A","door":"1F6AA","chair":"1FA91","toilet":"1F6BD","shower":"1F6BF",
  "bathtub":"1F6C1","razor":"1FA92","lotion_bottle":"1F9F4","safety_pin":"1F9F7","broom":"1F9F9","basket":"1F9FA","roll_of_paper":"1F9FB","soap":"1F9FC","sponge":"1F9FD","fire_extinguisher":"1F9EF","shopping_trolley":"1F6D2","smoking":"1F6AC","moyai":"1F5FF","earth_africa":"1F30D","earth_americas":"1F30E","earth_asia":"1F30F","globe_with_meridians":"1F310",
  "japan":"1F5FE","compass":"1F9ED","volcano":"1F30B","mount_fuji":"1F5FB","bricks":"1F9F1","house":"1F3E0","house_with_garden":"1F3E1","office":"1F3E2","post_office":"1F3E3","european_post_office":"1F3E4","hospital":"1F3E5","bank":"1F3E6","hotel":"1F3E8","love_hotel":"1F3E9","convenience_store":"1F3EA","school":"1F3EB","department_store":"1F3EC",
  "factory":"1F3ED","japanese_castle":"1F3EF","european_castle":"1F3F0","wedding":"1F492","tokyo_tower":"1F5FC","statue_of_liberty":"1F5FD","church":"26EA","mosque":"1F54C","hindu_temple":"1F6D5","synagogue":"1F54D","kaaba":"1F54B","fountain":"26F2","tent":"26FA","foggy":"1F301","night_with_stars":"1F303","sunrise_over_mountains":"1F304","sunrise":"1F305",
  "city_sunset":"1F306","city_sunrise":"1F307","bridge_at_night":"1F309","carousel_horse":"1F3A0","ferris_wheel":"1F3A1","roller_coaster":"1F3A2","barber":"1F488","circus_tent":"1F3AA","steam_locomotive":"1F682","railway_car":"1F683","bullettrain_side":"1F684","bullettrain_front":"1F685","train2":"1F686","metro":"1F687","light_rail":"1F688",
  "station":"1F689","tram":"1F68A","monorail":"1F69D","mountain_railway":"1F69E","train":"1F68B","bus":"1F68C","oncoming_bus":"1F68D","trolleybus":"1F68E","minibus":"1F690","ambulance":"1F691","fire_engine":"1F692","police_car":"1F693","oncoming_police_car":"1F694","taxi":"1F695","oncoming_taxi":"1F696","car":"1F697","oncoming_automobile":"1F698",
  "blue_car":"1F699","truck":"1F69A","articulated_lorry":"1F69B","tractor":"1F69C","motor_scooter":"1F6F5","manual_wheelchair":"1F9BD","motorized_wheelchair":"1F9BC","auto_rickshaw":"1F6FA","bike":"1F6B2","scooter":"1F6F4","skateboard":"1F6F9","busstop":"1F68F","fuelpump":"26FD","rotating_light":"1F6A8","traffic_light":"1F6A5",
  "vertical_traffic_light":"1F6A6","octagonal_sign":"1F6D1","construction":"1F6A7","anchor":"2693","boat":"26F5","canoe":"1F6F6","speedboat":"1F6A4","ship":"1F6A2","airplane_departure":"1F6EB","airplane_arriving":"1F6EC","parachute":"1FA82","seat":"1F4BA","helicopter":"1F681","suspension_railway":"1F69F","mountain_cableway":"1F6A0","aerial_tramway":"1F6A1",
  "rocket":"1F680","flying_saucer":"1F6F8","luggage":"1F9F3","hourglass":"231B","hourglass_flowing_sand":"23F3","watch":"231A","alarm_clock":"23F0","clock12":"1F55B","clock1230":"1F567","clock1":"1F550","clock130":"1F55C","clock2":"1F551","clock230":"1F55D","clock3":"1F552","clock330":"1F55E","clock4":"1F553","clock430":"1F55F","clock5":"1F554",
  "clock530":"1F560","clock6":"1F555","clock630":"1F561","clock7":"1F556","clock730":"1F562","clock8":"1F557","clock830":"1F563","clock9":"1F558","clock930":"1F564","clock10":"1F559","clock1030":"1F565","clock11":"1F55A","clock1130":"1F566","new_moon":"1F311","waxing_crescent_moon":"1F312","first_quarter_moon":"1F313","moon":"1F314","full_moon":"1F315",
  "waning_gibbous_moon":"1F316","last_quarter_moon":"1F317","waning_crescent_moon":"1F318","crescent_moon":"1F319","new_moon_with_face":"1F31A","first_quarter_moon_with_face":"1F31B","last_quarter_moon_with_face":"1F31C","full_moon_with_face":"1F31D","sun_with_face":"1F31E","ringed_planet":"1FA90","star":"2B50","star2":"1F31F","stars":"1F320",
  "milky_way":"1F30C","partly_sunny":"26C5","cyclone":"1F300","rainbow":"1F308","closed_umbrella":"1F302","umbrella_with_rain_drops":"2614","zap":"26A1","snowman_without_snow":"26C4","fire":"1F525","droplet":"1F4A7","ocean":"1F30A","jack_o_lantern":"1F383","christmas_tree":"1F384","fireworks":"1F386","sparkler":"1F387","firecracker":"1F9E8",
  "sparkles":"2728","balloon":"1F388","tada":"1F389","confetti_ball":"1F38A","tanabata_tree":"1F38B","bamboo":"1F38D","dolls":"1F38E","flags":"1F38F","wind_chime":"1F390","rice_scene":"1F391","red_envelope":"1F9E7","ribbon":"1F380","gift":"1F381","ticket":"1F3AB","trophy":"1F3C6","sports_medal":"1F3C5","first_place_medal":"1F947",
  "second_place_medal":"1F948","third_place_medal":"1F949","soccer":"26BD","baseball":"26BE","softball":"1F94E","basketball":"1F3C0","volleyball":"1F3D0","football":"1F3C8","rugby_football":"1F3C9","tennis":"1F3BE","flying_disc":"1F94F","bowling":"1F3B3","cricket_bat_and_ball":"1F3CF","field_hockey_stick_and_ball":"1F3D1","ice_hockey_stick_and_puck":"1F3D2",
  "lacrosse":"1F94D","table_tennis_paddle_and_ball":"1F3D3","badminton_racquet_and_shuttlecock":"1F3F8","boxing_glove":"1F94A","martial_arts_uniform":"1F94B","goal_net":"1F945","golf":"26F3","fishing_pole_and_fish":"1F3A3","diving_mask":"1F93F","running_shirt_with_sash":"1F3BD","ski":"1F3BF","sled":"1F6F7","curling_stone":"1F94C","dart":"1F3AF",
  "yo-yo":"1FA80","kite":"1FA81","8ball":"1F3B1","crystal_ball":"1F52E","nazar_amulet":"1F9FF","video_game":"1F3AE","slot_machine":"1F3B0","game_die":"1F3B2","jigsaw":"1F9E9","teddy_bear":"1F9F8","black_joker":"1F0CF","mahjong":"1F004","flower_playing_cards":"1F3B4","performing_arts":"1F3AD","art":"1F3A8","thread":"1F9F5","yarn":"1F9F6","atm":"1F3E7",
  "put_litter_in_its_place":"1F6AE","potable_water":"1F6B0","wheelchair":"267F","mens":"1F6B9","womens":"1F6BA","restroom":"1F6BB","baby_symbol":"1F6BC","wc":"1F6BE","passport_control":"1F6C2","customs":"1F6C3","baggage_claim":"1F6C4","left_luggage":"1F6C5","children_crossing":"1F6B8","no_entry":"26D4","no_entry_sign":"1F6AB","no_bicycles":"1F6B3",
  "no_smoking":"1F6AD","do_not_litter":"1F6AF","non-potable_water":"1F6B1","no_pedestrians":"1F6B7","no_mobile_phones":"1F4F5","underage":"1F51E","arrows_clockwise":"1F503","arrows_counterclockwise":"1F504","back":"1F519","end":"1F51A","on":"1F51B","soon":"1F51C","top":"1F51D","place_of_worship":"1F6D0","menorah_with_nine_branches":"1F54E",
  "six_pointed_star":"1F52F","aries":"2648","taurus":"2649","gemini":"264A","cancer":"264B","leo":"264C","virgo":"264D","libra":"264E","scorpius":"264F","sagittarius":"2650","capricorn":"2651","aquarius":"2652","pisces":"2653","ophiuchus":"26CE","twisted_rightwards_arrows":"1F500","repeat":"1F501","repeat_one":"1F502","fast_forward":"23E9","rewind":"23EA",
  "arrow_up_small":"1F53C","arrow_double_up":"23EB","arrow_down_small":"1F53D","arrow_double_down":"23EC","cinema":"1F3A6","low_brightness":"1F505","high_brightness":"1F506","signal_strength":"1F4F6","vibration_mode":"1F4F3","mobile_phone_off":"1F4F4","trident":"1F531","name_badge":"1F4DB","beginner":"1F530","o":"2B55","white_check_mark":"2705","x":"274C",
  "negative_squared_cross_mark":"274E","heavy_plus_sign":"2795","heavy_minus_sign":"2796","heavy_division_sign":"2797","curly_loop":"27B0","loop":"27BF","question":"2753","grey_question":"2754","grey_exclamation":"2755","exclamation":"2757","keycap_ten":"1F51F","capital_abcd":"1F520","abcd":"1F521","symbols":"1F523","abc":"1F524","ab":"1F18E","cl":"1F191",
  "cool":"1F192","free":"1F193","id":"1F194","new":"1F195","ng":"1F196","ok":"1F197","sos":"1F198","up":"1F199","vs":"1F19A","koko":"1F201","u6709":"1F236","u6307":"1F22F","ideograph_advantage":"1F250","u5272":"1F239","u7121":"1F21A","u7981":"1F232","accept":"1F251","u7533":"1F238","u5408":"1F234","u7a7a":"1F233","u55b6":"1F23A","u6e80":"1F235",
  "red_circle":"1F534","large_orange_circle":"1F7E0","large_yellow_circle":"1F7E1","large_green_circle":"1F7E2","large_blue_circle":"1F535","large_purple_circle":"1F7E3","large_brown_circle":"1F7E4","black_circle":"26AB","white_circle":"26AA","large_red_square":"1F7E5","large_orange_square":"1F7E7","large_yellow_square":"1F7E8","large_green_square":"1F7E9",
  "large_blue_square":"1F7E6","large_purple_square":"1F7EA","large_brown_square":"1F7EB","black_large_square":"2B1B","white_large_square":"2B1C","black_medium_small_square":"25FE","white_medium_small_square":"25FD","large_orange_diamond":"1F536","large_blue_diamond":"1F537","small_orange_diamond":"1F538","small_blue_diamond":"1F539",
  "small_red_triangle":"1F53A","small_red_triangle_down":"1F53B","diamond_shape_with_a_dot_inside":"1F4A0","radio_button":"1F518","white_square_button":"1F533","black_square_button":"1F532"
  };

/**
 * ASCII emoticons to unicode map, this member is filled with
 * JSON data dynamically loaded at startup
 *
 *  See: xows_tpl_init, xows_tpl_init_json, xows_tpl_template_parse_json
 */
const xows_tpl_emoticon_map = {
 ":": {
    ")":"1F642","(":"1F641","O":"1F62E",
    "P":"1F61B","D":"1F604","*":"1F617",
    "|":"1F610","#":"1F910","S":"1F616",
    "$":"1F633","/":"1F615",".":"1F636",
    "X":"1F922"},
  "8": {
    ")":"1F60E"},
  ":'": {
    ")":"1F602","(":"1F622","D":"1F923"},
  ";": {
    ")":"1F609","P":"1F61C"},
  "X": {
    ")":"1F606","D":"1F606","P":"1F61D"}
};

/**
 * Callback function for embeded media loaded
 */
let xows_tpl_fw_onembload = function() {};

/**
 * Callback function for embeded media loading error
 */
let xows_tpl_fw_onemberror = function() {};

/**
 * Set callback functions for common client events
 *
 * Possibles slot parameter value are the following:
 *  - embload   : Embeded media loaded
 *  - emberror  : Embeded media loading error
 *  - embclick  : Embeded media user click
 *
 * @param   {string}    type      Callback slot
 * @param   {function}  callback  Callback function to set
 */
function xows_tpl_set_callback(type, callback)
{
  if(!xows_isfunc(callback))
    return;

  switch(type.toLowerCase())
  {
    case "embload":    xows_tpl_fw_onembload = callback; break;
    case "emberror":   xows_tpl_fw_onemberror = callback; break;
  }
}

/**
 * Callback function for embeded media
 *
 * this function is used to keep event binding consistent after minification
 */
function xows_tpl_emld(media) {xows_tpl_fw_onembload(media);};

/**
 * Callback function for embeded media
 *
 * this function is used to keep event binding consistent after minification
 */
function xows_tpl_emer(event) {xows_tpl_fw_onemberror(event);};

/**
 * Launch the download of the specified template file
 *
 * @param   {string}    name      Template name to retreive file path
 * @param   {number}    type      Template type (instanced or import)
 */
function xows_tpl_template_load(name, type)
{
  // build download path URL
  let path = xows_options.lib_path+"/themes/"+xows_tpl_theme;

  // Select proper subfolder according template type
  switch(type)
  {
  case XOWS_TPL_IMPORT:
    path += "/import/";
    break;
  case XOWS_TPL_INSTANCED:
    path += "/instanced/";
    break;
  default:
    path += "/";
  }

  path += name+".html";

  // Forces browser to reload (uncache) templates files by adding a
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.tpl_force_uncache) {
    path += "?" + xows_gen_nonce_asc(4);
  }
  // Launch request to download template file
  const xhr = new XMLHttpRequest();
  xhr.open("GET", path, true);
  xhr._type = type; //< set ad hoc member
  xhr.onreadystatechange = function() {
    if(this.readyState === 4)
      if(this.status === 200) {
        xows_tpl_template_parse(this.responseText, this.responseURL, this._type);
      } else {
        xows_init_fatal(this.status, this.responseURL);
      }
  };
  // Increase count of template remaining to load
  xows_tpl_template_parse_remain++;
  xows_log(2,"tpl_template_load","loading file",path);
  xhr.send();
}

/**
 * Check for completed template loading and parsing
 *
 * This function is called each time a template is successfully
 * parsed, once all templates are parsed, the function call the DOM
 * initialization function.
 */
function xows_tpl_template_done()
{
  // Transfert template children
  while(xows_tpl_fragment.childNodes.length > 0) {
    document.body.appendChild(xows_tpl_fragment.firstChild);
  }

  xows_log(2,"tpl_template_done","templates parsing completed");

  xows_tpl_fragment = null;

  // Call the onready callback
  xows_tpl_fw_onready();
}

/**
 * Parse the given HTML data as static template
 *
 * Static template are intended to be added once in the document, they
 * are typically base GUI/layout templates.
 *
 * Intanciables templates are intended to be dynamically cloned
 * (instanced) multiple times, such as history messages or roster
 * contacts.
 *
 * Templates are loaded recursively, each template may include
 * indirections to other child templates. Static templates are
 * included as child within the static document while the
 * instanciable templates are stored in a separate pool. However notice
 * that a static templates cannot be included within instanciables ones
 * and will be ignored in this case.
 *
 * @param   {string}    html      HTML data to parse
 * @param   {string}    path      File URL/Path the data come from
 * @param   {number}    type      Template type (instanced or import)
 */
function xows_tpl_template_parse(html, path, type)
{
  xows_log(2,"tpl_template_parse","parsing template",path);

  // Translate HTML content to desired locale
  html = xows_l10n_parse(html);

  // Parse the given string as HTML to create the corresponding DOM tree
  // then returns the generated <body>.
  const temp_plate = xows_tpl_template_parser.parseFromString(html,"text/html");
  const template = xows_clean_dom(xows_tpl_template_parser.parseFromString(html,"text/html").body);

  if(!template) {
    xows_log(0,"tpl_template_parse","template parse error",path);
    return;
  }

  let i, nodes;
  const stat_load = [];
  const inst_load = [];

  if(type !== XOWS_TPL_INSTANCED) {
    // Search for element with "XOWS_TPL_IMPORT" attribute, meaning
    // its inner content must be loaded from another template file
    nodes = template.querySelectorAll("[XOWS_TPL_IMPORT]");
    i = nodes.length;
    while(i--) {
      if(!nodes[i].id) {
        xows_log(0,"tpl_template_parse","instance declared without id",path);
        continue;
      }
      stat_load.push(nodes[i].id); //< id is template file name
      nodes[i].removeAttribute("XOWS_TPL_IMPORT"); //< Remove the attribute
    }
  }

  // Search for element with "is_instance" attribute, meaning
  // its inner content is made of instantiable (clonable) element
  // and must be loaded from another template file
  nodes = template.querySelectorAll("[XOWS_TPL_INSTANCED]");
  i = nodes.length;
  while(i--) {
    if(!nodes[i].id) {
      xows_log(0,"tpl_template_parse","instance declared without id",path);
      continue;
    }
    inst_load.push(nodes[i].id); //< id is template file name
    nodes[i].parentNode.removeChild(nodes[i]); //< Remove the example object
  }

  // Extract file name from path
  let name = path.substring(path.lastIndexOf("/")+1).split(".")[0];

  if(type === XOWS_TPL_INSTANCED) {
    if(template.firstChild) {
      // Store instantiable data
      xows_tpl_model[name] = document.createDocumentFragment();
      xows_tpl_model[name].appendChild(template.firstChild);
    } else {
      document.head.appendChild(temp_plate.head.firstChild);
    }
  } else {
    // Search for an element the id that matches the name to append data
    // if an element is found, we place parsed data within it, otherwise
    // the parsed data is placed at root of document fragment
    let parent = xows_tpl_fragment.querySelector("#"+name);
    if(!parent) parent = xows_tpl_fragment;

    while(template.childNodes.length > 0) {
      parent.appendChild(template.firstChild);
    }
    // Start loading the needed static template files
    i = stat_load.length;
    while(i--) xows_tpl_template_load(stat_load[i], XOWS_TPL_IMPORT);
  }
  // Start loading the needed instantiable template files
  i = inst_load.length;
  while(i--) xows_tpl_template_load(inst_load[i], XOWS_TPL_INSTANCED);

  // Decrease remain count
  xows_tpl_template_parse_remain--;

  // If we no remain, template parsing is finished
  if(xows_tpl_template_parse_remain === 0) {
    xows_tpl_template_done();
  }
}

/**
 * Entry point to start the whole template loading and parsing job
 *
 * This function must be called once to load the desired set of
 * template.
 *
 * @param   {object}    onready   Function to be called once templates successfully loaded
 */
function xows_tpl_init(onready)
{
  // Set the onready callback
  if(onready) xows_tpl_fw_onready = onready;

  // Change default root and theme folder if requested
  if(xows_options.lib_path)
    xows_options.lib_path = xows_options.lib_path;

  if(xows_options.gui_theme)
    xows_tpl_theme = xows_options.gui_theme;

  // Load the theme CSS
  const css = document.createElement('link');
  css.rel = "stylesheet";
  css.type = "text/css";
  // Select normal or minified style file
  let css_file;
  if(xows_options.tpl_load_mincss) {
    css_file = "/style.min.css";
  } else {
    css_file = "/style.css";
  }
  css.href = xows_options.lib_path+"/themes/"+xows_tpl_theme+css_file;

  // Forces browser to reload (uncache) templates files by adding a
  // random string to URL. This option is mainly for dev and debug
  if(xows_options.tpl_force_uncache)
    css.href += "?" + xows_gen_nonce_asc(4);

  // Add the CSS <link to head
  document.head.appendChild(css);

  // Initialize for loading job
  xows_tpl_template_parse_remain = 0;
  xows_tpl_fragment = document.createDocumentFragment();
  // Start loading the first essential template file
  xows_tpl_template_load("body");
}

/**
 * Regular expression to match alone link
 */
const xows_tpl_reg_alone_link = /^\s*<a href=.+<\/a>\s*$/;

/**
 * Regular expression to match HTTP url
 */
const xows_tpl_reg_url = /^(?:http|https):\/\/(?:[!#$&-;=?-\[\]_a-z~]|%[0-9a-fA-F]{2})+/i;

/**
 * Regular expression to match code block
 */
const xows_tpl_reg_pre = /^```(.*?)\n(.+)```(?:\s?\n|\s?$)/s;

/**
 * Regular expression to match code span
 */
const xows_tpl_reg_code = /^`(\S.+?\S)`/;

/**
 * Regular expression to match strong span
 */
const xows_tpl_reg_italic = /(^\*\S.*?[^\s\*]\*)(?:[^\*]|$)/;

/**
 * Regular expression to match strong span
 */
const xows_tpl_reg_strong = /(^\*{2}\S.+?\S\*{2})(?:[^\*]|$)/;

/**
 * Regular expression to match strong span
 */
const xows_tpl_reg_emphas = /(^\*\S.+?\S\*)/;

/**
 * Regular expression to match emphasis span
 */
const xows_tpl_reg_underl = /^_\S.+?\S_/;

/**
 * Regular expression to match strike span
 */
const xows_tpl_reg_strike = /^~\S.+?\S~/;

/**
 * Regular expression to match block quote line
 */
const xows_tpl_reg_quote = /^(>+?) .+[^>](?=\n|$)/;

/**
 * Regular expression to match emoji short code
 */
const xows_tpl_reg_emoji = /^:([\w\-+]+):/;

/**
 * Regular expression to match ASCII smileys
 */
const xows_tpl_reg_emoticon = /^([X8:;]|:')([()|DPXO#$.\/*sS])(?=\s|$)/i;

/**
 * Map for HTML escape character from char code
 */
const xows_tpl_html_esc_map = new Map([[0x26,"&amp;"],[0x3C,"&lt;"],[0x3E,"&gt;"],[0x27,"&apos;"],[0x22,"&quot;"],[0x0A,"<br>"]]);

/**
 * Array contain collected URLs from the previous parsing
 */
const xows_tpl_parsed_url = new Array();

/**
 * Parsing function that transform raw message into styled message.
 *
 * The function also populate the xows_tpl_parse_urls array with all
 * parsed URLs
 *
 * @param   {string}    raw       Raw input string
 *
 * @return  {string}    Formated message
 */
function xows_tpl_parse_styling(raw)
{
  if(!raw || !raw.length)
    return "";

  let match;
  let span_i = 0;
  let span_b = 0;
  let span_u = false;
  let span_s = false;
  let quote_depth = 0;

  let result = "";

  let c, i = 0;

  // Reset parsed URLs array
  xows_tpl_parsed_url.length = 0;

  while(true) {

    // end of text
    if(i === raw.length)
      break;

    c = raw.charCodeAt(i);

    // Check for Quote block exit
    if(quote_depth && raw.charCodeAt(i-1) === 0x0A && c !== 0x3E) {
      while(quote_depth) { //< close ALL quote block
        result += "</blockquote>";
        quote_depth--;
      }
    }

    // http(s):// URL
    if(c === 0x48 || c === 0x68) { //< 'H' || 'h'
      if(match = xows_tpl_reg_url.exec(raw.substring(i))) {
        xows_tpl_parsed_url.push(match[0]); //< add to Array
        result += "<a href=\""+match[0]+"\" target=\"_blank\">"+match[0]+"</a>";
        i += match[0].length;
        continue;
      }
    }

    // Chek for Emojis and Emoticons
    if(c === 0x3A || c === 0x3B || c === 0x58 || c === 0x78 || c === 0x38) { //< ':' || ';' || 'X' || 'x' || '8'

      const substr = raw.substring(i);

      // Try for Emoji short code
      if(match = xows_tpl_reg_emoji.exec(substr)) {
        const code = xows_tpl_emoji_sc_map[match[1]];
        if(code) {
          result += "<emo-ji>&#x"+code+";</emo-ji>";
          i += match[0].length;
          continue;
        }
      }

      // Must be at start of line or precedded by space
      if(i === 0 || raw.charCodeAt(i-1) === 0x20) {

        if(match = xows_tpl_reg_emoticon.exec(substr)) {
          const code = xows_tpl_emoticon_map[match[1].toUpperCase()][match[2].toUpperCase()];
          if(code) {
            result += "<emo-ji>&#x"+code+";</emo-ji>";
            i += match[0].length;
            continue;
          }
        }
      }
    }

    // 0-9 A-Z a-z
    if((c > 0x2F && c < 0x3A) || (c > 0x40 && c < 0x5B) || (c > 0x60 && c < 0x7B)) {
      result += raw.charAt(i++);
      continue;
    }

    // Check for UTF-16 surrogate pair
    if((c > 0xD7FF && c < 0xE000)) {

      // Convert to 4 bytes codepoint
      c = 0x10000 + (((c & 0x3FF) << 10) | (raw.charCodeAt(i+1) & 0x3FF));

      // Check for raw emoji unicode
      if((c >= 0x2300 && c <= 0x2BFF) || (c >= 0x1F000 && c <= 0x1FB00))
        result += "<emo-ji>&#x"+c.toString(16)+";</emo-ji>";

      i += 2; //< step after the surrogate pair
      continue;
    }

    // Ephasis span (italic, bold)
    if(c === 0x2A) { //< '*'

      if(span_b) {
        if(span_b === i) {
          result += "</b>"; //< close span
          span_b = 0;
          i += 2; continue;
        }
      } else {
        if(raw.charCodeAt(i+1) === 0x2A) {
          match = xows_tpl_reg_strong.exec(raw.substring(i));
          if(match) {
            span_b = i + (match[1].length - 2);
            result += "<b>"; //< open span
            i += 2; continue;
          }
        }
      }

      if(span_i) {
        if(span_i === i) {
          result += "</i>"; //< close span
          span_i = 0;
          i++; continue;
        }
      } else {
        if(span_b) {
          match = xows_tpl_reg_emphas.exec(raw.substring(i));
        } else {
          match = xows_tpl_reg_italic.exec(raw.substring(i));
        }
        if(match) {
          span_i = i + (match[1].length - 1);
          result += "<i>"; //< open span
          i++; continue;
        }
      }

    }

    // Underline span
    if(c === 0x5F) { //< '_'
      if(span_u) {
        span_u = false;
        result += "</u>"; //< close span
        i++; continue;
      } else {
        if(span_u = xows_tpl_reg_underl.test(raw.substring(i))) {
          result += "<u>"; //< open span
          i++; continue;
        }
      }
    }

    // Strike span
    if(c === 0x7E) {  //< '~'
      if(span_s) {
        span_s = false;
        result += "</s>"; //< close span
        i++; continue;
      } else {
        if(span_s = xows_tpl_reg_strike.test(raw.substring(i))) {
          result += "<s>"; //< open span
          i++; continue;
        }
      }
    }

    // Check for Quote block
    if(c === 0x3E) { //< '>'

      // Must be at start of a new line
      if(i === 0 || raw.charCodeAt(i-1) === 0x0A) {

        let depth = 0;
        while(match = xows_tpl_reg_quote.exec(raw.substring(i))) {
          if(raw.charCodeAt(i+1) === 0x20) { //< ' '
            i += 2; //< eat '> '
          } else {
            i++;    //< eat '>'
          }
          depth++;
        }

        if(depth) {
          while(depth > quote_depth) {
            result += "<blockquote>"; //< open quote block
            quote_depth++;
          }
          while(depth < quote_depth) {
            result += "</blockquote>"; //< close quote block
            quote_depth--;
          }
          continue;
        }
      }
    }

    // Check for preformated and code
    if(c === 0x60) { //< '`'

      const substr = raw.substring(i);

      if(match = xows_tpl_reg_code.exec(substr)) {
        result += "<code>"+match[1]+"</code>";
        i += match[0].length;
        continue;
      }

      // Must be at start of a new line
      if(i === 0 || raw.charCodeAt(i-1) === 0x0A) {
        if(match = xows_tpl_reg_pre.exec(substr)) {
          result += "<pre>"+match[2]+"</pre>";
          i += match[0].length;
          continue;
        }
      }
    }

    // Finaly escape character if required
    if(xows_tpl_html_esc_map.has(c)) {
      result += xows_tpl_html_esc_map.get(c);
    } else {
      result += raw.charAt(i);
    }

    i++;
  }

  return result;
}

/**
 * Create iframe HTML sample with the specified url as sources and common
 * attributes.
 *
 * @param   {string}    href      Media original URL
 *
 * @return  {string}    Iframe HTML sample
 */
function xows_tpl_as_iframe(href)
{
  return "<iframe sandbox=\"allow-scripts allow-same-origin\" src=\""+href+"\"/>";
}

/**
 * Function to create HTML sample for embeding wrapper element
 *
 * If the href parameter is not null, an HTML hyperlink is prepended to
 * the embeded media. If the element parameter is null, it is simply
 * ignored.
 *
 * @param   {string}    href      Media original URL
 * @param   {string}    media     Media or embeded element to wrap
 * @param   {string}   [style]    Optional class name to style wrapper
 * @param   {string}   [title]    Optional title to add to wrapper
 *
 * @return  {string}    Remplacement HTML sample
 */
function xows_tpl_embed_wrap(href, media, style, title)
{
  let wrap = "<embd-wrap class='"; if(style) wrap += style; wrap += "'>";
  if(title) wrap += "<a href='"+href+"' target='_blank'>"+title+"</a>";

  // Add envent callback and common attributes
  wrap += media.replace(/src=/g,"loading='lazy' onload='xows_tpl_emld(this)' onerror='xows_tpl_emer(this)' src=");
  wrap += "</embd-wrap>";

  return wrap;
}

/**
 * Function to create HTML embeded image from url
 *
 * @param   {string}    href      Image URL
 * @param   {string}    ext       Image file extension part
 *
 * @return  {string}    Replacement HTML sample
 */
function xows_tpl_embed_image(href, ext)
{
  return xows_tpl_embed_wrap(href,
              "<img src=\""+href+"\">",
              "EMBD-IMG LOADING");
}

/**
 * Function to create HTML embeded movie from url
 *
 * @param   {string}    href      Movie URL
 * @param   {string}    ext       Movie file extension part
 *
 * @return  {string}    Replacement HTML sample
 */
function xows_tpl_embed_movie(href, ext)
{
  return xows_tpl_embed_wrap(href,
              "<video controls src=\""+href+"\"></video>",
              "EMBD-VID");
}

/**
 * Function to create HTML embeded audio from url
 *
 * @param   {string}    href      Audio URL
 * @param   {string}    ext       Audio file extension part
 *
 * @return  {string}    Replacement HTML sample
 */
function xows_tpl_embed_audio(href, ext)
{
  return xows_tpl_embed_wrap(href,
              "<audio controls src=\""+href+"\"/>",
              "EMBD-SND");
}

/**
 * Function to create HTML embeded Youtube movie from url
 *
 * @param   {string}    href      Youtube movie URL
 * @param   {string}    domain    Matched domain substring
 *
 * @return  {string}    Replacement HTML sample
 */
function xows_tpl_embed_youtube(href, domain)
{
  const match = href.match(/(?:v=|embed\/|shorts\/|youtu\.be\/)([\w\-]+)(\?.+)?/);
  if(!match) return null;
  let ref = match[1];
  // add options and replace the potential t= by start=
  if(match[2]) ref += match[2].replace(/t=/,"start=");
  return xows_tpl_embed_wrap(href, xows_tpl_as_iframe("https://www.youtube.com/embed/"+ref),
                             "EMBD-IFR LOADING","YouTube");
}

/**
 * Function to create HTML embeded Dailymotion movie from url
 *
 * @param   {string}    href      Dailymotion movie URL
 * @param   {string}    domain    Matched domain substring
 *
 * @return  {string}    Replacement HTML sample
 */
function xows_tpl_embed_dailymo(href, domain)
{
  const match = href.match(/(?:video|dai\.ly)\/([\w\d]+)/);
  if(!match) return null;
  return xows_tpl_embed_wrap(href, xows_tpl_as_iframe("https://www.dailymotion.com/embed/video/"+match[1]),
                             "EMBD-IFR LOADING","Dailymotion");
}

/**
 * Function to create HTML embeded Dailymotion movie from url
 *
 * @param   {string}    href      Dailymotion movie URL
 * @param   {string}    domain    Matched domain substring
 *
 * @return  {string}    Replacement HTML sample
 */
function xows_tpl_embed_vimeo(href, domain)
{
  const match = href.match(/\/([\d]+)/);
  if(!match) return null;
  return xows_tpl_embed_wrap(href, xows_tpl_as_iframe("https://player.vimeo.com/video/"+match[1]),
                             "EMBD-IFR LOADING","Vimeo");
}

/**
 * Function to create HTML embeded Odysee movie from url
 *
 * @param   {string}    href      Odysee movie URL
 * @param   {string}    domain    Matched domain substring
 *
 * @return  {string}    Replacement HTML sample
 */
function xows_tpl_embed_odysee(href, domain)
{
  const match = href.match(/.com\/(.*)/);
  if(!match) return null;
  return xows_tpl_embed_wrap(href, xows_tpl_as_iframe("https://odysee.com/$/embed/"+match[1]),
                             "EMBD-IFR LOADING","Odysee");
}

/**
 * Function to create HTML embeded file of unknown type to be
 * downloaded.
 *
 * @param   {string}    href      Dailymotion movie URL
 * @param   {string}    domain    Matched domain substring
 *
 * @return  {string}    Replacement HTML sample
 */
function xows_tpl_embed_upld(href, domain)
{
  const file = decodeURI(href.match(/(.+\/)*(.+\..+)/)[2]);
  return xows_tpl_embed_wrap(href,
              "<a class=\"dnld-btn\" href=\""+href+"\" target=\"_blank\"></a>",
              "EMBD-DNL",file);
}

/**
 * Per file extension embeding function correspondance map
 */
let xows_tpl_embed_files = {
  "JPG"             : xows_tpl_embed_image,
  "JPEG"            : xows_tpl_embed_image,
  "GIF"             : xows_tpl_embed_image,
  "PNG"             : xows_tpl_embed_image,
  "WEBP"            : xows_tpl_embed_image,
  "SVG"             : xows_tpl_embed_image,
  "MP4"             : xows_tpl_embed_movie,
  "MPEG"            : xows_tpl_embed_movie,
  "AVI"             : xows_tpl_embed_movie,
  "MP3"             : xows_tpl_embed_audio,
  "OGG"             : xows_tpl_embed_audio
};

/**
 * Per plateform embeding function correspondance map
 */
let xows_tpl_embed_sites = {
  "www.youtube.com"       : xows_tpl_embed_youtube,
  "youtu.be"              : xows_tpl_embed_youtube,
  "www.dailymotion.com"   : xows_tpl_embed_dailymo,
  "dai.ly"                : xows_tpl_embed_dailymo,
  "vimeo.com"             : xows_tpl_embed_vimeo,
  "odysee.com"            : xows_tpl_embed_odysee //< not properly implemented
};

/**
 * Per service URL embeding function correspondance map
 */
let xows_tpl_embed_uplds = { };

/**
 * Add or modify an embedding site/plateform with its parsing function
 *
 * @param   {string}    match     Domain name to match in the parsed URL
 * @param   {object}    parse     Function to create embd media from URL
 */
function xows_tpl_embed_add_site(match, parse)
{
  xows_tpl_embed_sites[match] = parse;
}

/**
 * Add or modify an embedding site/plateform with its parsing function
 *
 * @param   {string}    match     File extension to match in the parsed URL
 * @param   {object}    parse     Function to create embd media from URL
 */
function xows_tpl_embed_add_file(match, parse)
{
  xows_tpl_embed_files[match] = parse;
}

/**
 * Add an embedding site for file download.
 *
 * @param   {string}    match     Domain name to match in the parsed URL
 */
function xows_tpl_embed_add_upld(match)
{
  xows_tpl_embed_uplds[match] = xows_tpl_embed_upld;
}

/**
 * Creates embeded medias and formated links from found raw URL
 *
 * @param   {string[]}  urls      List of URL to parse and embed
 *
 * @return  {string}    Formated HTML data of embedded medias
 */
function xows_tpl_parse_embeds(urls)
{
  if(!urls.length)
    return null;

  let match, k, href, media, embeds = "";

  for(let i = 0, n = urls.length; i < n; ++i) {

    href = urls[i];
    media = null;

    // Check whether we found a known and supported file extension
    match = href.match(/\.([\w\d]+)(\?|$)/);
    if(match) {
      k = match[1].toUpperCase(); //< always compare with uppercase
      if(xows_tpl_embed_files[k]) media = xows_tpl_embed_files[k](href,k);
    }

    if(!media) {
      // Check whether we found a known and supported plateform/site
      match = href.match(/\/\/(.*?[\w\d\-_]+\.\w+)\//);
      if(match) {
        k = match[1].toLowerCase(); //< always compare with lowercase
        // check for externam plateforms
        if(xows_tpl_embed_sites[k]) media = xows_tpl_embed_sites[k](href,k);
        // check for internal services (HTTP-Upload)
        if(xows_tpl_embed_uplds[k]) media = xows_tpl_embed_uplds[k](href,k);
      }
    }
    // Append embedded media string
    if(media) embeds += media;
  }

  return embeds.length ? embeds : null;
}

/**
 * Stores the dynamically created CSS classes for avatars DataURL
 */
let xows_tpl_avat_cls_db = new Map();

/**
 * Create a new CSS class with data-url as background-image style to
 * be used as avatar
 *
 * @param   {string}    hash      Avatar data hash
 *
 * @return  {string}    CSS class name corresponding to Avatar data hash
 */
function xows_tpl_spawn_avat_cls(peer)
{
  // Get avatar Hash or Generate temporary
  let hash;
  if(peer.avat) {

    hash = peer.avat; //< XEP-0084 Avatar Hash value

  } else {

    // Get proper peer identity
    const iden = xows_cach_peer_iden(peer);

    // Generate temporary avatar hash from Peer ident
    hash = xows_cach_avat_temp_hash(iden);

    // Generate (if don't exists) temporary avatar using given hash
    xows_cach_avat_temp_data(iden, hash);
  }

  // Create Avatar Steel Sheet rule
  if(!xows_tpl_avat_cls_db.has(hash)) {

    // Compose the CSS class name
    const cls = "h-" + hash;

    // Add new style sheet with class definition
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerText = "."+cls+" {background-image:url(\""+xows_cach_avat_get(hash)+"\");}\r\n";
    document.head.appendChild(style);

    // Add this to local DB to keep track of added classes
    xows_tpl_avat_cls_db.set(hash, cls);
  }

  return xows_tpl_avat_cls_db.get(hash);
}

/**
 * Build and returns a new instance of Subscribe Request <li-peer> Element
 * from existing template.
 *
 * @param   {object}    cont      Contact Object
 *
 * @return  {element}   Subscribe Request <li-peer> Element
 */
function xows_tpl_spawn_rost_subs(cont)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model["peer-pend"].firstChild.cloneNode(true);

  // Set content to proper elements
  inst.dataset.id = cont.addr;
  inst.title = cont.addr;
  inst.querySelector("PEER-NAME").innerText = cont.addr;

  return inst;
}

/**
 * Update the specified instance of roster Contact <li-peer> Element.
 *
 * @param   {element}   li_peer   Subscribe <li-peer> Element to update
 * @param   {object}    cont      Contact Object
 */
function xows_tpl_update_rost_subs(li_peer, cont)
{
  // Update content
  li_peer.title = cont.addr;
  li_peer.querySelector("PEER-NAME").innerText = cont.addr;
}

/**
 * Build and returns a new instance of roster Contact <li-peer> HTML Element
 * from existing template.
 *
 * @param   {object}    cont      Contact Object
 * @param   {string}   [text]     Optional error text
 *
 * @return  {element}   Contact <li-peer> Element
 */
function xows_tpl_spawn_rost_cont(cont, text)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model["peer-cont"].firstChild.cloneNode(true);

  // Set content to proper elements
  inst.dataset.id = cont.addr;

  if(cont.subs & XOWS_SUBS_TO) {
    inst.title = cont.name+" ("+cont.addr+")";
    inst.querySelector("PEER-NAME").innerText = cont.name;
    inst.querySelector("PEER-META").innerText = cont.stat ? cont.stat:"";
    inst.querySelector("BADG-SHOW").dataset.show = cont.show || 0;
    // Set proper class for avatar
    inst.querySelector("PEER-AVAT").className = xows_tpl_spawn_avat_cls(cont);
  } else {
    // We awaits for contact subscription
    inst.title = cont.addr;
    inst.classList.add("PEER-DENY");
    inst.querySelector("PEER-NAME").innerText = cont.addr;
    inst.querySelector("PEER-META").innerText = text ? xows_l10n_get(text)
                                                     : xows_l10n_get("Authorization pending");
    inst.querySelector("BADG-SHOW").hidden = true;
    inst.querySelector("[name='cont_bt_rtry']").disabled = false;
  }

  return inst;
}

/**
 * Update the specified instance of roster Contact <li-peer> Element.
 *
 * @param   {element}    li       Contact <li-peer> Element to update
 * @param   {object}    cont      Contact Object
 * @param   {string}   [text]     Optional error text
 */
function xows_tpl_update_rost_cont(li, cont, text)
{
  const badg_show = li.querySelector("BADG-SHOW");
  const bttn_subs = li.querySelector("[name='cont_bt_rtry']");

  // Update content
  if(cont.subs & XOWS_SUBS_TO) {
    li.title = cont.name+" ("+cont.addr+")";
    li.classList.remove("PEER-DENY");
    li.querySelector("PEER-NAME").innerText = cont.name;
    li.querySelector("PEER-META").innerText = cont.stat ? cont.stat : "";
    badg_show.hidden = false;
    badg_show.dataset.show = cont.show || 0;
    bttn_subs.disabled = true;
    // Set proper class for avatar
    li.querySelector("PEER-AVAT").className = xows_tpl_spawn_avat_cls(cont);
  } else {
    // We awaits for contact subscription
    li.title = cont.addr;
    li.classList.add("PEER-DENY");
    li.querySelector("PEER-NAME").innerText = cont.addr;
    li.querySelector("PEER-META").innerText = text ? xows_l10n_get(text)
                                                   : xows_l10n_get("Authorization pending");
    badg_show.hidden = true;
    bttn_subs.disabled = false;
  }
}

/**
 * Build and returns a new instance of roster Room <li-peer> Element
 * from existing template.
 *
 * @param   {object}    room      Room Object
 *
 * @return  {element}   Room <li-peer> Element
 */
function xows_tpl_spawn_rost_room(room)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model["peer-room"].firstChild.cloneNode(true);

  // Set content to proper elements
  inst.dataset.id = room.addr;
  inst.title = room.name+" ("+room.addr+")";
  inst.querySelector("PEER-NAME").innerText = room.name;
  inst.querySelector("PEER-META").innerText = room.desc;
  inst.querySelector("BADG-LOCK").hidden = !(room.prot || !room.open);
  //const peer_avat = inst.querySelector("PEER-AVAT");

  return inst;
}

/**
 * Update the specified instance of roster Room <li-peer> Element.
 *
 * @param   {element}   li        Room <li-peer> Element to update
 * @param   {object}    room      Room Object
 */
function xows_tpl_update_rost_room(li, room)
{
  // Update content
  li.title = room.name+" ("+room.addr+")";
  li.querySelector("PEER-NAME").innerText = room.name;
  li.querySelector("PEER-META").innerText = room.desc;
  li.querySelector("BADG-LOCK").hidden = !(room.prot || !room.open);
  //const peer_avat = li.querySelector("PEER-AVAT");
}

/**
 * Build and returns a new instance of Room Occupant <li-peer> Element
 * from existing template.
 *
 * @param   {object}    occu      Occupant Object
 * @param   {boolean}   rost      Configure for Roster rather than MUC List
 *
 * @return  {element}   Occupant <li-peer> Element
 */
function xows_tpl_spawn_room_occu(occu, rost = false)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model["peer-occu"].firstChild.cloneNode(true);

  inst.dataset.id = occu.addr;
  inst.dataset.ocid = occu.ocid;

  if(rost)
    inst.querySelector("PEER-ACTS").hidden = true;

  // Set content to proper elements
  inst.title = occu.name+" ("+occu.addr+")";
  inst.querySelector("PEER-NAME").innerText = occu.name;
  inst.querySelector("PEER-META").innerText = occu.stat ? occu.stat : "";
  inst.querySelector("BADG-SHOW").dataset.show = occu.show || 0;
  // Set proper class for avatar
  const peer_avat = inst.querySelector("PEER-AVAT");
  peer_avat.className = xows_tpl_spawn_avat_cls(occu);
  return inst;
}

/**
 * Update the specified instance of Room Occupant <li-peer> Element.
 *
 * @param   {element}   li        Occupant <li-peer> Element to update
 * @param   {object}    occu      Occupant Object
 */
function xows_tpl_update_room_occu(li, occu)
{
  // Update content
  li.title = occu.name+" ("+occu.addr+")";
  li.querySelector("PEER-NAME").innerText = occu.name;
  li.querySelector("PEER-META").innerText = occu.stat ? occu.stat : "";
  li.querySelector("BADG-SHOW").dataset.show = occu.show || 0;
  // Set proper class for avatar
  li.querySelector("PEER-AVAT").className = xows_tpl_spawn_avat_cls(occu);
}

/**
 * Return most suitable message identifier between id attribute origin-id
 * and stanza-id.
 *
 * @param   {object}    peer     Related Peer object
 * @param   {element}   li_mesg  Message <li-mesg> Element to parse
 *
 * @return  {string}    Message identifier
 */
function xows_tpl_mesg_bestref(peer, li_mesg)
{
  // XEP-0424 (Message Retraction)
  //
  // For messages of type 'groupchat', the ID assigned to the stanza by the
  // group chat itself must be used. This is discovered in a <stanza-id>
  // element with a 'by' attribute that matches the bare JID of the group
  // chat, as defined in Unique and Stable Stanza IDs (XEP-0359)

  // XEP-0461 (Message Replies)
  //
  // For messages of type 'groupchat', the stanza's 'id' attribute MUST NOT be
  // used for replies. Instead, in group chat situations, the ID assigned to the
  // stanza by the group chat itself must be used. This is discovered in a
  // <stanza-id> element with a 'by' attribute that matches the bare JID of
  // the group chat, as defined in Unique and Stable Stanza IDs (XEP-0359)

  if(peer.type === XOWS_PEER_ROOM) {
    return li_mesg.dataset.szid ? li_mesg.dataset.szid : li_mesg.dataset.id;
  } else {
    return li_mesg.dataset.orid ? li_mesg.dataset.orid : li_mesg.dataset.id;
  }
}

/**
 * Build and returns a new instance of history Null-Message <li-mesg> Element
 * from existing template.
 *
 * @param   {string}    id          Message reference ID
 * @param   {string}    from        Message author JID
 * @param   {string}    body        Message body
 *
 * @return  {element}   History message <li-mesg> Element
 */
function xows_tpl_mesg_null_spawn(id, from, body) {

  // Clone DOM tree from template
  const inst = xows_tpl_model["hist-null"].firstChild.cloneNode(true);

  // Set message minimum data
  inst.dataset.id = id;
  inst.dataset.orid = id;
  inst.dataset.szid = id;
  inst.dataset.from = from;

  // Add body (usually error/tombstone message)
  inst.querySelector("MESG-BODY").innerHTML = body;

  // Return element
  return inst;
}

/**
 * Build and returns a new instance of history Message <li-mesg> Element
 * from existing template.
 *
 * @param   {object}    peer        Related Peer object
 * @param   {object}    mesg        Message object
 * @param   {boolean}   wait        Message wait for Receipt
 * @param   {element}  [li_prv]     Optional previous message <li-mesg> Element
 * @param   {element}  [li_rep]     Optional retracted message <li-mesg> Element
 * @param   {element}  [li_rpl]     Optional replied message <li-mesg> Element
 *
 * @return  {element}   History message <li-mesg> Element
 */
function xows_tpl_mesg_spawn(peer, mesg, wait, li_prv, li_rep, li_rpl)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model["hist-mesg"].firstChild.cloneNode(true);

  inst.dataset.id = mesg.id;
  inst.dataset.from = mesg.from;
  inst.dataset.time = mesg.time;
  if(mesg.orid) inst.dataset.orid = mesg.orid;
  if(mesg.szid) inst.dataset.szid = mesg.szid;
  if(mesg.ocid) inst.dataset.ocid = mesg.ocid;

  // Check for Reply/Quoted Message
  if(li_rpl) {

    const mesg_rply = inst.querySelector("MESG-RPLY");

    // Checks whether there is a reply but message cannot be found
    if(li_rpl.classList.contains("MESG-NULL")) {

      // Set tombstone reply section
      mesg_rply.classList.add("MESG-FAIL");

    } else {

      // Get author Peer of quoted message
      const peer_rply = xows_cli_author_get(peer, li_rpl.dataset.from, li_rpl.dataset.ocid);

      // Check whether message is referencing ourself
      if(peer_rply.self)
        inst.classList.add("MENTION");

      // Get proper Peer identifier
      let peerid = xows_cli_peer_iden(peer_rply);

      // Set Quoted avatar
      const rply_avat = inst.querySelector("RPLY-AVAT");
      rply_avat.dataset.peer = peerid;
      rply_avat.className = xows_tpl_spawn_avat_cls(peer_rply);

      // Set Quoted nickname
      const rply_from = inst.querySelector("RPLY-FROM");
      rply_from.dataset.peer = peerid;
      rply_from.innerText = peer_rply.name;

      // Set reply author address
      mesg_rply.dataset.to = peer_rply.addr;
    }

    // Correted (discarded) message doesn't have Body
    const mesg_body = li_rpl.querySelector("MESG-BODY");
    // Set Quoted text
    inst.querySelector("RPLY-BODY").innerHTML = mesg_body ? mesg_body.innerText : "[...]";

    // Add Reply data and show element
    mesg_rply.dataset.id = xows_tpl_mesg_bestref(peer, li_rpl);
    mesg_rply.hidden = false;
  }

  // Set Grouped/Append message style
  let append;

  if(li_rep) {
    // If this is a Correction/Retraction message, we kee the same
    // style as the retracted one
    append = li_rep.classList.contains("MESG-APPEND");
    // Set message as Modified
    inst.classList.add("MESG-MODIFY");
  } else if(li_prv && !li_rpl) {
    // If previous message author is different or if elapsed time is
    // greater than # minutes, we create a new full message block
    append = ((li_prv.dataset.from === mesg.from) && ((mesg.time - li_prv.dataset.time) < XOWS_MESG_AGGR_THRESHOLD));
  }

  // Set message "Append" style
  if(append)
    inst.classList.add("MESG-APPEND");

  // Get message author
  const author = xows_cli_author_get(peer, mesg.from, mesg.ocid);

  // Get proper Peer identifier
  let peerid = xows_cli_peer_iden(author);

  // Set author name with JID data
  const mesg_from = inst.querySelector("MESG-FROM");
  mesg_from.dataset.peer = peerid;
  mesg_from.innerText = author.name;
  // Set avatar class with JID data
  const mesg_avat = inst.querySelector("MESG-AVAT");
  mesg_avat.dataset.peer = peerid;
  mesg_avat.className = xows_tpl_spawn_avat_cls(author);

  // Set proper value to message elements
  if(author.self) {
    inst.classList.add("MESG-SENT");
    // No wait for receipt, mark message as receipt received
    if(!wait) inst.classList.add("MESG-RECP");
    // Add raw body for message edition
    inst.querySelector("MESG-BODY").dataset.raw = xows_html_escape(mesg.body);
  }

  // Set time stamp elements
  inst.querySelector("MESG-HOUR").innerText = xows_l10n_houre(mesg.time);
  inst.querySelector("MESG-DATE").innerText = xows_l10n_date(mesg.time);

  const mesg_body = inst.querySelector("MESG-BODY");
  const mesg_embd = inst.querySelector("MESG-EMBD");

  // Parse body for styling
  const styled = xows_tpl_parse_styling(mesg.body);
  mesg_body.innerHTML = styled;

  // Check whether we have URLs to embeds
  const embeds = xows_tpl_parse_embeds(xows_tpl_parsed_url);
  if(embeds) {

    // Add embedded medias
    mesg_embd.innerHTML = embeds;
    mesg_embd.hidden = false;

    // check whether message is an alone link
    if(xows_tpl_reg_alone_link.test(styled))
      mesg_body.hidden = true;
  }

  // Return final tree
  return inst;
}

/**
 * Update the specified instance of Message <li-mesg> Element.
 *
 * @param   {element}   li_msg    Message <li-mesg> Element to update
 * @param   {object}    peer      Related chat Peer object
 * @param   {object}    mesg      Message Object
 * @param   {boolean}   recp      Marks message as receipt received
 * @param   {element}  [li_rpl]   Optional replied message <li-mesg> Element
 */
function xows_tpl_mesg_update(li_msg, peer, mesg, recp, li_rpl)
{
  if(mesg) {
    li_msg.dataset.orid = mesg.orid;
    li_msg.dataset.szid = mesg.szid;
    li_msg.dataset.ocid = mesg.ocid;
  }

  // Marks message à receipt received
  if(recp) li_msg.classList.add("MESG-RECP");

  if(li_rpl) {

    // Add Reply data and show element
    const mesg_rply = li_msg.querySelector("MESG-RPLY");

    // Checks whether there is a reply but message cannot be found
    if(li_rpl.classList.contains("MESG-NULL")) {

      // Set reply as tombstone
      mesg_rply.classList.add("MESG-FAIL");

      // Remove MENTION class if exists
      li_msg.classList.remove("MENTION");

    } else {

      // Get author Peer of quoted message
      const peer_rply = xows_cli_author_get(peer, li_rpl.dataset.from, li_rpl.dataset.ocid);

      // Set reply author address
      mesg_rply.dataset.to = peer_rply.addr;
    }

    // Update reference for corrected messages forwarding
    mesg_rply.dataset.id = xows_tpl_mesg_bestref(peer, li_rpl);

    // Correted message (discarded) doesn't have Body
    const mesg_body = li_rpl.querySelector("MESG-BODY");
    // Set Quoted text
    li_msg.querySelector("RPLY-BODY").innerHTML = mesg_body ? mesg_body.innerText : "[...]";
  }
}

/**
 * Build and insert new <mesg-edit> Element instance into the given
 * <li-mesg> Element. The newly inserted Element is returned.
 *
 * @param   {element}   li_msg      History message <li-mesg> Element
 *
 * @return  {element}   Message editor <mesg-edit> Elements
 */
function xows_tpl_mesg_edit_insert(li_msg)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model["mesg-edit"].firstChild.cloneNode(true);

  inst.dataset.id = li_msg.id;

  const mesg_body = li_msg.querySelector("MESG-BODY");

  inst.querySelector("MESG-INPT").innerHTML = mesg_body.dataset.raw;
  mesg_body.parentNode.insertBefore(inst, mesg_body);

  // Add the EDIT class
  li_msg.classList.add("MESG-EDITOR");

  return inst;
}

/**
 * Remove the <mesg-edit> Element from the specified <li-mesg> Element.
 *
 * @param   {element}   li_msg    History message <li-mesg> Element
 */
function xows_tpl_mesg_edit_remove(li_msg)
{
  // Remove the <mesg-edit> element
  const mesg_main = li_msg.querySelector("MESG-MAIN");

  // It may happen that message is already empty du to discard after
  // correction, so we prevent Uncaught Error...
  if(mesg_main)
    mesg_main.removeChild(mesg_main.querySelector("MESG-EDIT"));

  // Remove the EDIT class
  li_msg.classList.remove("MESG-EDITOR");
}

/**
 * Build and insert new <mesg-trsh> Element instance into the given
 * <li-mesg> Element. The newly inserted Element is returned.
 *
 * @param   {element}   li_msg     History message <li-mesg> Element
 *
 * @return  {element}   Message delete <mesg-trsh> Element
 */
function xows_tpl_mesg_trsh_insert(li_msg)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model["mesg-trsh"].firstChild.cloneNode(true);

  inst.dataset.id = li_msg.id;

  const mesg_embd = li_msg.querySelector("MESG-EMBD");
  mesg_embd.parentNode.insertBefore(inst, mesg_embd);

  // Add the TRASH class
  li_msg.classList.add("MESG-TRASH");

  return inst;
}

/**
 * Remove the <mesg-trsh> Element from the specified <li-mesg> Element.
 *
 * @param   {element}   li_msg     History message <li-mesg> Element
 */
function xows_tpl_mesg_trsh_remove(li_msg)
{
  // Remove the <mesg-trsh> element
  const mesg_main = li_msg.querySelector("MESG-MAIN");

  // It may happen that message is already empty du to discard after
  // retraction, so we prevent Uncaught Error...
  if(mesg_main)
    mesg_main.removeChild(mesg_main.querySelector("MESG-TRSH"));

  // Remove the TRASH class
  li_msg.classList.remove("MESG-TRASH");
}

/**
 * Build and returns a new instance of Room Administration <li-memb>
 * Element from existing template.
 *
 * @param   {object}    item       Occupant affiliation/role data Object
 * @param   {boolean}   affi       Admin user affiliation (Admin or Owner)
 *
 * @return  {element}   Room-Admin <li-memb> Elements
 */
function xows_tpl_admn_memb_spawn(item, affi)
{
  // Select proper template
  let tmpl;
  if(item.role) {
    tmpl = "memb-role";
  } else if(item.affi) {
    tmpl = (item.affi == XOWS_AFFI_OUTC) ? "memb-outc" : "memb-affi";
  }

  // Clone DOM tree from template
  const inst = xows_tpl_model[tmpl].firstChild.cloneNode(true);

  // Set common (if available) values
  inst.dataset.bare = item.jid;
  inst.dataset.nick = item.nick;

  // Set content to proper elements
  inst.querySelector("MEMB-ADDR").innerText = item.jid ? item.jid : "";
  inst.querySelector("MEMB-NICK").innerText = item.nick ? item.nick : "";

  // Configure affiliation-specific stuff
  if(item.affi) {

    if(item.affi > XOWS_AFFI_OUTC) {

      inst.dataset.affi = item.affi;
      //inst.disabled = (item.affi >= affi);
      if((affi < XOWS_AFFI_OWNR) && (item.affi >= affi))
        inst.setAttribute("disabled","");

      const radios = inst.querySelectorAll("MEMB-RADIO");

      for(let i = 0; i < radios.length; ++i) {
        radios[i].dataset.on = (radios[i].dataset.affi == item.affi);
        // Admin doesn't have permission to revoke/grant admin or owner
        if(affi < XOWS_AFFI_OWNR)
          radios[i].hidden = radios[i].dataset.affi > XOWS_AFFI_MEMB;
      }
    }
  }

  return inst;
}

/**
 * Update the specified instance of Room Administration <li-memb> Element.
 *
 * @param   {element}   li        <li-memb> Element to update
 * @param   {number}    affi      Affiliation to set
 * @param   {number}    aref      Affiliation reference to set/remove as Modified
 */
function xows_tpl_admn_memb_update(li, affi, aref)
{
  // Get list (or single) radio element(s)
  const radio = li.querySelectorAll("MEMB-RADIO");

  if(radio.length > 1) {
    // Set proper radio on, switch off others
    for(let i = 0; i < radio.length; ++i)
      radio[i].dataset.on = (radio[i].dataset.affi == affi);
  } else {
    // Toggle single radio on/off
    const turn_off = (radio[0].dataset.on == "true");
    radio[0].dataset.on = turn_off ? "false" : "true";
    // Change affiliation to set to reference value
    if(turn_off) affi = aref;
  }

  // Update <li-memb> affi value
  li.dataset.affi = affi;

  // Set or remove as modified depending reference
  if(aref != null) {
    if(affi != aref) {
      li.classList.add("MODIFIED");
    } else {
      li.classList.remove("MODIFIED");
    }
  }
}

/**
 * Build and returns a new instance of Jingle Audio Peer <strm-video> Element
 * from existing template.
 *
 * @param   {object}    peer      Peer object
 *
 * @return  {element}   Audio Peer <strm-audio> Element
 */
function xows_tpl_spawn_stream_audio(peer)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model["strm-audio"].firstChild.cloneNode(true);

  // Set content to proper elements
  inst.dataset.peer = xows_cli_peer_iden(peer);
  inst.title = peer.name;
  const strm_avat = inst.querySelector("STRM-AVAT");
  strm_avat.className = xows_tpl_spawn_avat_cls(peer);

  return inst;
}

/**
 * Build and returns a new instance of Jingle Video Peer <strm-video> Element
 * from existing template.
 *
 * @param   {object}    peer      Peer object
 *
 * @return  {element}   Video Peer <strm-video> Element
 */
function xows_tpl_spawn_stream_video(peer)
{
  // Clone DOM tree from template
  const inst = xows_tpl_model["strm-video"].firstChild.cloneNode(true);

  // Set content to proper elements
  inst.dataset.peer = xows_cli_peer_iden(peer);
  inst.title = peer.name;

  return inst;
}
