<?php
/**
 * NOKS Chemicals hand-off — noksindustrial.com
 *
 * Paste into Code Snippets (Snippets → Add New → "Run everywhere") or the
 * child theme's functions.php. Remove the snippet to undo every change.
 *
 * What it does:
 *  1. 79 chemical products here duplicate pages on chemicals.noksindustrial.com
 *     and were competing with them for the same "… in Kenya" searches. Each
 *     one now declares the chemicals page as its canonical (Yoast), so Google
 *     ranks one page per product instead of splitting the two.
 *  2. Those products are dropped from the Yoast XML sitemap — a sitemap that
 *     lists a page whose canonical points elsewhere sends Google mixed signals.
 *  3. Each of those product pages shows a link to its chemicals-site page.
 *  4. Every page gets a footer link to the chemicals site.
 *
 * The pages stay live and purchasable; nothing is redirected or deleted.
 * Generated 2026-10-05 from the reviewed mapping in docs/parent-site/.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const NOKS_CHEM_BASE = 'https://chemicals.noksindustrial.com';

function noks_chem_map() {
	return array(
		2954 => 'carboxymethyl-cellulose', // Carboxymethyl Cellulose  in Kenya, Uganda and Tanzania
		2958 => 'oleic-acid', // Oleic Acid in Kenya, Uganda and Tanzania
		2968 => 'sodium-gluconate', // Sodium Gluconate in Kenya, Uganda and Tanzania
		2970 => 'sodium-perborate-monohydrate', // Sodium Perborate in Kenya, Uganda and Tanzania
		2972 => 'ferrous-sulfate-heptahydrate', // Ferrous Sulphate in Kenya, Uganda and Tanzania
		2974 => 'ethylenediaminetetraacetic-acid-edta', // EDTA in Kenya, Uganda and Tanzania
		2985 => 'calcium-carbonate', // Calcium Carbonate in Kenya, Uganda and Tanzania
		2987 => 'calcined-kaolin', // Kaolin in Kenya, Uganda and Tanzania
		2989 => 'industrial-salt', // Industrial Salt in Kenya, Uganda and Tanzania
		2994 => 'iron-oxide-yellow-920', // Yellow Oxide in Kenya, Uganda and Tanzania
		2996 => 'xylene', // Xylene in Kenya, Uganda and Tanzania
		2998 => 'jk-white-portland-cement-type-1', // White Cement in Kenya, Uganda and Tanzania
		3014 => 'jk-white-portland-cement-type-1', // White Cement in Kenya, Uganda & Tanzania
		3017 => 'white-mineral-oil', // White Oil in Kenya, Uganda and Tanzania
		3021 => 'toluene', // Toluene in Kenya, Uganda and Tanzania
		3027 => 'titanium-dioxide-rutile', // Titanium Dioxide in Kenya, Uganda and Tanzania
		3029 => 'cetearyl-alcohol', // Cetyl Stearyl Alcohol in Kenya, Uganda and Tanzania
		3031 => 'sodium-bentonite-powder', // Bentonite in Kenya, Uganda and Tanzania
		3036 => 'sulfuric-acid-98', // Sulphuric Acid in Kenya, Uganda & Tanzania
		3038 => 'talc-powder', // Talc Powder in Kenya, Uganda & Tanzania
		3054 => 'talc-powder', // Talc Powder in Kenya, Uganda and Tanzania
		3056 => 'sulfuric-acid-98', // Sulphuric Acid in Kenya, Uganda and Tanzania
		3058 => 'sodium-tripolyphosphate', // Sodium Tripolyphosphate in Kenya, Uganda and Tanzania
		3060 => 'white-petroleum-jelly-usp-grade', // Petroleum Jelly in Kenya, Uganda and Tanzania
		3062 => 'sodium-metabisulfite', // Sodium Metabisulphite in Kenya, Uganda and Tanzania
		3064 => 'sodium-metasilicate-anhydrous', // Sodium Metasilicate in Kenya, Uganda and Tanzania
		3066 => 'sodium-lauryl-ether-sulphate-sles-70', // Sodium Lauryl Ether Sulphate in Kenya, Uganda and Tanzania
		3068 => 'sodium-carbonate-soda-ash', // Sodium Carbonate in Kenya, Uganda and Tanzania
		3070 => 'sodium-hexametaphosphate', // Sodium Hexametaphosphate in Kenya, Uganda and Tanzania
		3075 => 'iron-oxide-red-pigment', // Red Oxide in Kenya, Uganda and Tanzania
		3077 => 'acrylic-homopolymer', // Homopolymer in Kenya, Uganda and Tanzania
		3080 => 'polyvinyl-alcohol', // Polyvinyl Alcohol in Kenya, Uganda and Tanzania
		3082 => 'pine-oil', // Pine Oil in Kenya, Uganda and Tanzania
		3084 => 'paraffin-wax-type-ii', // Paraffin Wax in Kenya, Uganda and Tanzania
		3086 => 'c9-petroleum-resin', // Petroleum Resin in Kenya, Uganda and Tanzania
		3088 => 'perchloroethylene', // Perchloroethylene in Kenya, Uganda & Tanzania
		3092 => 'perchloroethylene', // Perchloroethylene in Kenya, Uganda and Tanzania
		3098 => 'nitric-acid-65-technical-grade', // Nitric Acid in Kenya, Uganda and Tanzania
		3105 => 'n-butanol', // N-Butanol in Kenya, Uganda and Tanzania
		3110 => 'monopropylene-glycol', // Mono Propylene Glycol in Kenya, Uganda and Tanzania
		3112 => 'monoethanolamine', // Mono Ethanolamine in Kenya, Uganda and Tanzania
		3114 => 'microcrystalline-wax-wx-160s', // Micro Wax S160 in Kenya, Uganda and Tanzania
		3121 => 'methyl-ethyl-ketone-mek', // Methyl Ethyl Ketone in Kenya, Uganda and Tanzania
		3134 => 'formaldehyde-solution-37-41', // Formaldehyde in Kenya, Uganda and Tanzania
		3136 => 'ethyl-acetate', // Ethyl Acetate in Kenya, Uganda and Tanzania
		3138 => 'acrylic-homopolymer', // Homopolymer in Kenya, Uganda & Tanzania
		3140 => 'styrene-acrylic-emulsion', // Styrene Acrylic in Kenya, Uganda & Tanzania
		3142 => 'vam-veova-emulsion', // VAM VEO in Kenya, Uganda & Tanzania
		3145 => 'short-oil-alkyd-resin', // Short Oil Fast Drying Alkyd Resin in Kenya, Uganda and Tanzania
		3147 => 'long-oil-alkyd-resin', // Long Oil Alkyd Resin in Kenya, Uganda and Tanzania
		3149 => 'short-oil-alkyd-resin', // Short Oil Non-Drying Alkyd Resin in Kenya, Uganda and Tanzania
		3158 => 'cocamide-dea-cdea', // Cocamide DEA in Kenya, Uganda and Tanzania
		3164 => 'dextrose-monohydrate', // Dextrose Monohydrate in Kenya, Uganda and Tanzania
		3166 => 'cyclohexanone', // Cyclohexanone in Kenya, Uganda and Tanzania
		3168 => 'copperii-sulfate-pentahydrate', // Copper Sulphate Pentahydrate in Kenya, Uganda and Tanzania
		3174 => 'caustic-soda-flakes', // Caustic Soda Flakes in Kenya, Uganda and Tanzania
		3176 => 'calcium-hypochlorite', // Calcium Hypochlorite in Kenya, Uganda and Tanzania
		3178 => 'calcium-chloride-technical-grade', // Calcium Chloride in Kenya, Uganda and Tanzania
		3180 => 'citric-acid-anhydrous', // Citric Acid in Kenya, Uganda & Tanzania
		3183 => 'hydrogen-peroxide-50-technical-grade', // Hydrogen Peroxide in Kenya, Uganda & Tanzania
		3185 => 'ammonium-chloride', // Ammonium Chloride in Kenya, Uganda & Tanzania
		3187 => 'aluminium-sulphate-alum', // Aluminium Sulphate Powder in Kenya, Uganda & Tanzania
		3189 => 'aluminium-sulphate-alum', // Aluminium Sulphate Rocks in Kenya, Uganda & Tanzania
		3192 => 'activated-carbon', // Activated Carbon in Kenya, Uganda & Tanzania
		3196 => 'methyl-ethyl-ketone-mek', // Methyl Ethyl Ketone in Kenya, Uganda & Tanzania
		3198 => 'isopropyl-alcohol', // Isopropyl Alcohol in Kenya, Uganda & Tanzania
		3199 => 'acetone', // Acetone in Kenya, Uganda & Tanzania
		3201 => 'hydrogen-peroxide-50-technical-grade', // Hydrogen Peroxide 50% in Kenya, Uganda & Tanzania
		3203 => 'soya-lecithin-liquid', // Soya Lecithin in Kenya, Uganda & Tanzania
		3209 => 'sodium-cyclamate', // Sodium Cyclamate in Kenya, Uganda & Tanzania
		3213 => 'sodium-lactate-60-solution', // Sodium Lactate 60% in Kenya, Uganda & Tanzania
		3215 => 'lactic-acid-80-food-grade', // Lactic Acid 80% in Kenya, Uganda & Tanzania
		3217 => 'lactic-acid-80-food-grade', // Lactic Acid 80% in Kenya, Uganda & Tanzania
		3219 => 'potassium-sorbate', // Potassium Sorbate in Kenya, Uganda & Tanzania
		3221 => 'monosodium-glutamate', // Monosodium Glutamate in Kenya, Uganda & Tanzania
		3223 => 'malic-acid', // Malic Acid in Kenya, Uganda & Tanzania
		3232 => 'borax-decahydrate-technical-granular', // Borax Decahydrate in Kenya, Uganda and Tanzania
		3236 => 'sodium-xylene-sulfonate', // Sodium Xylene Sulfonate in Kenya, Uganda and Tanzania
		3238 => 'calcium-carbonate', // Whiting 40 in Kenya, Uganda and Tanzania
	);
}

/** The chemicals-site URL for the current product, or null. */
function noks_chem_target( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_queried_object_id();
	$map     = noks_chem_map();
	return isset( $map[ $post_id ] ) ? NOKS_CHEM_BASE . '/products/' . $map[ $post_id ] : null;
}

// 1. Cross-domain canonical (also drives Yoast's og:url).
add_filter( 'wpseo_canonical', function ( $canonical ) {
	if ( is_singular( 'product' ) && ( $target = noks_chem_target() ) ) {
		return $target;
	}
	return $canonical;
} );
add_filter( 'wpseo_opengraph_url', function ( $url ) {
	if ( is_singular( 'product' ) && ( $target = noks_chem_target() ) ) {
		return $target;
	}
	return $url;
} );

// 2. Keep them out of the Yoast sitemap.
add_filter( 'wpseo_exclude_from_sitemap_by_post_ids', function ( $ids ) {
	return array_merge( (array) $ids, array_keys( noks_chem_map() ) );
} );

// 3. Link from each duplicate product page to its chemicals-site page.
add_action( 'woocommerce_single_product_summary', function () {
	$target = noks_chem_target();
	if ( ! $target ) {
		return;
	}
	printf(
		'<p class="noks-chem-link" style="margin:1em 0;padding:.75em 1em;border-left:3px solid #0C48E6;background:#f5f7fb">'
		. 'Specifications, SDS and bulk pricing: <a href="%s"><strong>%s at NOKS Chemical Division</strong></a></p>',
		esc_url( $target ),
		esc_html( get_the_title() )
	);
}, 25 );

// 4. Sitewide footer link.
add_action( 'wp_footer', function () {
	printf(
		'<div class="noks-chem-footer" style="text-align:center;padding:12px;font-size:14px">'
		. 'Industrial chemicals, laboratory reagents and water treatment: '
		. '<a href="%s"><strong>NOKS Chemical Division — chemical suppliers in Kenya</strong></a></div>',
		esc_url( NOKS_CHEM_BASE . '/' )
	);
} );
