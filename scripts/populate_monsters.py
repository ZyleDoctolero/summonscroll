import json, random, urllib.request

SB_URL = "https://nvqbbbcvyhqwqfutpnje.supabase.co"
SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cWJiYmN2eWhxd3FmdXRwbmplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDgzNTU2NSwiZXhwIjoyMDk2NDExNTY1fQ.jUhILLUQUngJlzQU5cPwYX0f1IsJRpqdbuPBq30h3CE"

with open("C:/tmp/monster_ids.json") as f:
    monsters = json.load(f)

# ── Skill pools by role + element ──
ATTACKER_SKILLS = {
    "Arcane": [
        {"name": "Arcane Bolt", "dmg": 120, "mp": 8, "desc": "Hurls a bolt of raw arcane energy."},
        {"name": "Eldritch Barrage", "dmg": 200, "mp": 15, "desc": "Unleashes a flurry of magical projectiles."},
        {"name": "Mana Burst", "dmg": 350, "mp": 25, "desc": "Detonates stored mana in a devastating explosion."},
        {"name": "Void Rend", "dmg": 180, "mp": 12, "desc": "Tears through enemy defenses with a dimensional slash."},
    ],
    "Chaos": [
        {"name": "Warp Strike", "dmg": 130, "mp": 8, "desc": "A reality-bending melee attack."},
        {"name": "Chaos Flame", "dmg": 220, "mp": 15, "desc": "Engulfs the target in unpredictable fire."},
        {"name": "Madness Surge", "dmg": 380, "mp": 28, "desc": "Channels pure entropy into a devastating blow."},
        {"name": "Entropy Slash", "dmg": 160, "mp": 10, "desc": "A blade strike infused with chaotic energy."},
    ],
    "Void": [
        {"name": "Null Spike", "dmg": 110, "mp": 7, "desc": "Pierces with condensed nothingness."},
        {"name": "Abyss Claw", "dmg": 190, "mp": 14, "desc": "Rakes the enemy with claws from beyond."},
        {"name": "Cosmic Annihilation", "dmg": 400, "mp": 30, "desc": "Erases matter with anti-reality energy."},
        {"name": "Star Rend", "dmg": 170, "mp": 11, "desc": "Tears at the enemy with stellar shrapnel."},
    ],
    "Death": [
        {"name": "Bone Spike", "dmg": 115, "mp": 7, "desc": "Launches sharpened bone projectiles."},
        {"name": "Necrotic Slash", "dmg": 210, "mp": 14, "desc": "A rotting blade strike that decays on contact."},
        {"name": "Soul Harvest", "dmg": 370, "mp": 26, "desc": "Rips the life force directly from the target."},
        {"name": "Grave Claw", "dmg": 165, "mp": 10, "desc": "Spectral hands tear at the living."},
    ],
    "Nature": [
        {"name": "Thorn Lash", "dmg": 105, "mp": 6, "desc": "Whips the target with razor thorns."},
        {"name": "Wild Fang", "dmg": 195, "mp": 13, "desc": "A savage bite with primal fury."},
        {"name": "Earthquake Slam", "dmg": 340, "mp": 24, "desc": "Shatters the ground beneath the enemy."},
        {"name": "Vine Crush", "dmg": 150, "mp": 9, "desc": "Constricting vines crush the target."},
    ],
    "Divine": [
        {"name": "Holy Smite", "dmg": 125, "mp": 8, "desc": "Calls down divine judgment."},
        {"name": "Radiant Blade", "dmg": 215, "mp": 15, "desc": "A sword of pure light cleaves through darkness."},
        {"name": "Wrath of Heaven", "dmg": 390, "mp": 28, "desc": "Channels the fury of the celestial host."},
        {"name": "Sacred Lance", "dmg": 175, "mp": 12, "desc": "A spear of holy energy pierces the wicked."},
    ],
    "Dread": [
        {"name": "Phantom Strike", "dmg": 110, "mp": 7, "desc": "Strikes from the spectral plane."},
        {"name": "Terror Claw", "dmg": 200, "mp": 14, "desc": "Rakes with fear-infused talons."},
        {"name": "Nightmare Scream", "dmg": 360, "mp": 25, "desc": "A psychic shriek that shatters minds."},
        {"name": "Ghoul Bite", "dmg": 155, "mp": 10, "desc": "A venomous bite from beyond the grave."},
    ],
    "Digital": [
        {"name": "Data Spike", "dmg": 120, "mp": 8, "desc": "Fires compressed data as a weapon."},
        {"name": "Circuit Overload", "dmg": 205, "mp": 15, "desc": "Overloads the target with raw data."},
        {"name": "System Crash", "dmg": 370, "mp": 27, "desc": "A total system failure devastating all processes."},
        {"name": "Pixel Blast", "dmg": 160, "mp": 10, "desc": "Scatters digitized shrapnel at the enemy."},
    ],
    "Primal": [
        {"name": "Stone Fist", "dmg": 130, "mp": 8, "desc": "A punch with the weight of the earth."},
        {"name": "Magma Strike", "dmg": 225, "mp": 16, "desc": "Molten rock coats a devastating blow."},
        {"name": "Primeval Fury", "dmg": 380, "mp": 28, "desc": "Unleashes the raw wrath of ancient beasts."},
        {"name": "Earth Shatter", "dmg": 170, "mp": 11, "desc": "Splits the ground with primal force."},
    ],
    "Stellar": [
        {"name": "Plasma Bolt", "dmg": 125, "mp": 8, "desc": "Fires superheated stellar plasma."},
        {"name": "Nova Strike", "dmg": 230, "mp": 16, "desc": "A miniature stellar explosion on impact."},
        {"name": "Supernova Burst", "dmg": 420, "mp": 32, "desc": "Detonates with the force of a dying star."},
        {"name": "Meteor Slash", "dmg": 180, "mp": 12, "desc": "Channels the velocity of a falling star."},
    ],
}

TANK_SKILLS = [
    {"name": "Iron Guard", "dmg": 0, "mp": 6, "desc": "Raises DEF by 30% for 3 turns."},
    {"name": "Taunt", "dmg": 0, "mp": 5, "desc": "Forces all enemies to target this unit."},
    {"name": "Fortress Wall", "dmg": 0, "mp": 18, "desc": "Reduces all incoming damage by 50% for 2 turns."},
    {"name": "Shield Bash", "dmg": 80, "mp": 8, "desc": "A heavy shield strike that stuns for 1 turn."},
]

HEALER_SKILLS = [
    {"name": "Mend", "dmg": 0, "mp": 8, "desc": "Restores 150 HP to one ally."},
    {"name": "Rejuvenate", "dmg": 0, "mp": 12, "desc": "Heals all allies for 100 HP over 3 turns."},
    {"name": "Divine Restoration", "dmg": 0, "mp": 25, "desc": "Fully restores one ally's HP."},
    {"name": "Cleanse", "dmg": 0, "mp": 6, "desc": "Removes all debuffs from one ally."},
]

SUPPORT_SKILLS = [
    {"name": "Empower", "dmg": 0, "mp": 8, "desc": "Boosts one ally's ATK by 25% for 3 turns."},
    {"name": "Barrier", "dmg": 0, "mp": 10, "desc": "Grants a shield absorbing 200 damage."},
    {"name": "Rally Cry", "dmg": 0, "mp": 20, "desc": "Boosts all allies' ATK and DEF by 15%."},
    {"name": "Haste", "dmg": 0, "mp": 7, "desc": "Increases one ally's SPD by 30% for 2 turns."},
]

DEBUFFER_SKILLS = [
    {"name": "Weaken", "dmg": 60, "mp": 7, "desc": "Reduces target's ATK by 20% for 3 turns."},
    {"name": "Corrode", "dmg": 80, "mp": 10, "desc": "Lowers target's DEF by 25% for 3 turns."},
    {"name": "Hex", "dmg": 50, "mp": 15, "desc": "Curses the target, reducing all stats by 15%."},
    {"name": "Slow", "dmg": 40, "mp": 6, "desc": "Reduces target's SPD by 30% for 2 turns."},
]

# Element-flavored extras for non-attacker roles
ELEMENT_EXTRAS = {
    "Arcane": [{"name": "Arcane Shield", "dmg": 0, "mp": 10, "desc": "Wraps an ally in a magical barrier absorbing 250 damage."}],
    "Chaos": [{"name": "Chaos Rift", "dmg": 100, "mp": 12, "desc": "Opens a rift dealing random damage to all enemies."}],
    "Void": [{"name": "Void Step", "dmg": 0, "mp": 8, "desc": "Phase through attacks, gaining evasion for 1 turn."}],
    "Death": [{"name": "Life Drain", "dmg": 90, "mp": 10, "desc": "Drains HP from the target to heal self."}],
    "Nature": [{"name": "Regrowth", "dmg": 0, "mp": 8, "desc": "Gradually restores 5% max HP each turn for 3 turns."}],
    "Divine": [{"name": "Blessed Aura", "dmg": 0, "mp": 10, "desc": "Grants divine protection, boosting healing received by 30%."}],
    "Dread": [{"name": "Soul Chill", "dmg": 70, "mp": 8, "desc": "Freezes the target's soul, reducing SPD by 40%."}],
    "Digital": [{"name": "Firewall", "dmg": 0, "mp": 10, "desc": "Blocks the next incoming debuff on the team."}],
    "Primal": [{"name": "Earthen Armor", "dmg": 0, "mp": 8, "desc": "Encases in stone, boosting DEF by 40% for 2 turns."}],
    "Stellar": [{"name": "Gravity Well", "dmg": 60, "mp": 10, "desc": "Pulls enemies together, reducing their evasion."}],
}

REALM_SKILLS = {
    "Arcane": "Vault Resonance: +10% ATK when in an Arcane team.",
    "Chaos": "Entropy Field: 15% chance to inflict random debuff on hit.",
    "Void": "Null Aura: 10% chance to negate incoming damage.",
    "Death": "Undying Will: Survive one lethal hit with 1 HP per battle.",
    "Nature": "Wild Growth: Regenerate 3% max HP each turn.",
    "Divine": "Holy Shield: Start battle with a 100 HP barrier.",
    "Dread": "Fear Aura: 10% chance to stun enemies at turn start.",
    "Digital": "Overclock: +15% SPD for the first 3 turns.",
    "Primal": "Ancient Roots: +12% DEF against physical attacks.",
    "Stellar": "Star Forge: +8% ATK and SPD in boss battles.",
}

RARITY_LORE = {
    "common": [
        "A lowly creature barely noticed in the wilds of {realm}. Yet even the weakest beings harbor untapped potential.",
        "Found scavenging the outskirts of {realm}, this creature poses little threat alone but swarms can overwhelm the unwary.",
        "One of countless {element} spawn roaming {realm}. Scholars note their surprising resilience despite humble origins.",
    ],
    "uncommon": [
        "Evolved beyond its common kin, this {element} creature has begun to tap into the ambient energy of {realm}.",
        "Toughened by the harsh conditions of {realm}, this {role} has earned its place in the bestiary through sheer tenacity.",
        "A step above the rabble. This creature channels {element} energy with growing proficiency.",
    ],
    "rare": [
        "A formidable {element} entity that commands respect throughout {realm}. Summoners prize its balanced power.",
        "Born from the concentrated {element} energy of {realm}, this creature's strength rivals seasoned warriors.",
        "Sought after by collectors and warriors alike, this rare {role} combines power with tactical versatility.",
    ],
    "elite": [
        "An apex predator of {realm}, wielding {element} power with devastating precision. Few survive an encounter.",
        "Legends speak of this elite guardian patrolling the deepest reaches of {realm}, annihilating all challengers.",
        "Forged in the crucible of {realm}'s most violent storms, this elite {role} is a living weapon.",
    ],
    "epic": [
        "A catastrophic force of {element} destruction. When this creature stirs in {realm}, entire armies take notice.",
        "Ancient texts describe this being as a walking calamity, its {element} power reshaping the landscape of {realm}.",
        "The mere presence of this epic creature warps the {element} currents of {realm}, bending reality to its will.",
    ],
    "legendary": [
        "A mythical being whispered of in the oldest scrolls. Its mastery of {element} transcends mortal understanding, and {realm} itself trembles at its awakening.",
        "Once thought to be mere legend, this creature's emergence heralds a new age for {realm}. Its {element} power is absolute.",
    ],
    "mythic": [
        "Beyond legendary. This entity exists outside normal reality, its {element} essence woven into the fabric of {realm} itself. To summon it is to court the impossible.",
    ],
    "ex": [
        "THE apex entity of {realm}. A world-ending threat whose {element} power dwarfs all others combined. Records of its existence are classified at the highest level.",
    ],
}

ORIGIN_TEMPLATES = {
    "Arcane": "Manifested from the ley lines deep within the Ancient Vaults.",
    "Chaos": "Spawned from the roiling madness of the Chaos Wastes.",
    "Void": "Emerged from the lightless depths of The Outer Dark.",
    "Death": "Risen from the cursed soil of the Blighted Expanse.",
    "Nature": "Born from the untamed wilds of the Wild Frontier.",
    "Divine": "Descended from the hallowed planes of the Divine Threshold.",
    "Dread": "Coalesced from the spectral mists of the Haunted Veil.",
    "Digital": "Compiled from corrupted data streams in the Digital Nexus.",
    "Primal": "Awakened from primordial slumber in the Elder Realm.",
    "Stellar": "Fell from the cosmic void beyond the Void Frontier.",
}

REALM_NAME_MAP = {
    "Arcane": "Ancient Vaults", "Chaos": "Chaos Wastes", "Void": "The Outer Dark",
    "Death": "Blighted Expanse", "Nature": "Wild Frontier", "Divine": "Divine Threshold",
    "Dread": "Haunted Veil", "Digital": "Digital Nexus", "Primal": "Elder Realm",
    "Stellar": "Void Frontier",
}

random.seed(42)

RARITY_MULT = {
    "common": 0.6, "uncommon": 0.8, "rare": 1.0, "elite": 1.3,
    "epic": 1.6, "legendary": 2.0, "mythic": 2.5, "ex": 3.5,
}

def get_skills(role, element, rarity):
    mult = RARITY_MULT.get(rarity, 1.0)

    if role == "attacker":
        pool = ATTACKER_SKILLS.get(element, ATTACKER_SKILLS["Arcane"])
    elif role == "tank":
        pool = list(TANK_SKILLS)
    elif role == "healer":
        pool = list(HEALER_SKILLS)
    elif role == "support":
        pool = list(SUPPORT_SKILLS)
    else:  # debuffer
        pool = list(DEBUFFER_SKILLS)

    # Add element-specific extra skill
    extras = ELEMENT_EXTRAS.get(element, [])
    if extras and role != "attacker":
        pool = pool + extras

    chosen = random.sample(pool, min(3, len(pool)))
    skills = []
    for s in chosen:
        scaled = dict(s)
        scaled["dmg"] = int(s["dmg"] * mult)
        scaled["mp"] = max(3, int(s["mp"] * mult))
        skills.append(json.dumps(scaled))
    return skills


success = 0
errors = 0

for m in monsters:
    element = m["element"]
    rarity = m["rarity"]
    role = m["role"]
    realm = REALM_NAME_MAP.get(element, "the realm")

    lore_pool = RARITY_LORE.get(rarity, RARITY_LORE["common"])
    lore = random.choice(lore_pool).format(realm=realm, element=element, role=role)
    origin = ORIGIN_TEMPLATES.get(element, "Origin unknown.")
    realm_skill = REALM_SKILLS.get(element, "None")
    skills = get_skills(role, element, rarity)

    update = {
        "lore": lore,
        "origin": origin,
        "realm_skill": realm_skill,
        "skill_1": skills[0] if len(skills) > 0 else None,
        "skill_2": skills[1] if len(skills) > 1 else None,
        "skill_3": skills[2] if len(skills) > 2 else None,
    }

    data = json.dumps(update).encode("utf-8")
    req = urllib.request.Request(
        f"{SB_URL}/rest/v1/monsters?id=eq.{m['id']}",
        data=data,
        method="PATCH",
        headers={
            "apikey": SB_KEY,
            "Authorization": f"Bearer {SB_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    try:
        urllib.request.urlopen(req)
        success += 1
    except Exception as e:
        errors += 1
        if errors <= 5:
            print(f"Error updating {m['name']} ({m['id']}): {e}")

print(f"Done! {success} updated, {errors} errors")
