"""
Demo data generator: har website type ki ek JSON file -> backend/src/main/resources/demo/<type>.json
Chalao:  python tools/gen_demo.py

Format:
  "u:<unsplash-id>"  = Unsplash photo (landscape), "p:<id>" = portrait (team / testimonials)
  "_key"             = is row ka naam, dusri row "@<key>" se refer kar sakti hai (category_id: "@events")
Backend DemoCatalog in sab ko resolve karta hai; DemoDataService import karte waqt photos download karta hai.
"""
import json
import re
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "backend", "src", "main", "resources", "demo")

P = ["p:1507003211169-0a1dd7228f2d", "p:1494790108377-be9c29b29330", "p:1500648767791-00dcc994a43e", "p:1438761681033-6461ffad8d80",
     "p:1472099645785-5658abf4ff4e", "p:1544005313-94ddf0286df2", "p:1506794778202-cad84cf45f1d", "p:1534528741775-53994a69daeb"]


def u(i):
    return "u:" + i


def faq(*pairs):
    return [{"title": q, "answer": a} for q, a in pairs]


def stats(*items):
    return [{"title": t, "value": v, "icon": i} for t, v, i in items]


def partners(*names):
    return [{"title": n} for n in names]


def testi(*items):
    return [{"title": t, "parent_name": n, "child_name": info, "description": d, "photo": P[i % 8]} for i, (t, n, info, d) in enumerate(items)]


def team(*items):
    return [{"title": n, "designation": d, "bio": b, "photo": P[i % 8]} for i, (n, d, b) in enumerate(items)]


def sliders(*items):
    return [{"title": t, "description": d, "image": u(img)} for t, d, img in items]


def gallery(cats, photos):
    """cats: [(key, title)], photos: [(title, img, catkey)]"""
    return (
        [{"_key": k, "title": t} for k, t in cats],
        [{"title": t, "image": u(img), "category_id": "@" + c} for t, img, c in photos],
    )


def blogs(*items):
    return [{"title": t, "slug": s, "author": a, "published_date": d, "cover_image": u(img), "summary": sm,
             "body": f"<p>{sm}</p><p>{body}</p>", "tags": tags} for t, s, a, d, img, sm, body, tags in items]


def services(*items):
    return [{"title": t, "icon": i, "summary": s, "price": p, "image": u(img) if img else None} for t, i, s, p, img in items]


def plans(*items):
    return [{"title": t, "price": p, "period": per, "features": "\n".join(f), "highlighted": h, "badge": "Most Popular" if h else None,
             "button_text": b, "button_link": "/contact"} for t, p, per, f, h, b in items]


def catalog(*items):
    return [{"title": t, "category": c, "price": p, "old_price": op, "image": u(img), "badge": b, "location": loc, "specs": sp, "summary": s}
            for t, c, p, op, img, b, loc, sp, s in items]


def projects(*items):
    return [{"title": t, "category": c, "client": cl, "location": loc, "cover_image": u(img), "project_date": d, "summary": s,
             "description": f"<p>{s}</p>"} for t, c, cl, loc, img, d, s in items]


def page(title, slug, body):
    return {"title": title, "slug": slug, "page_heading": title, "page_body": body}


DATA = {}

# ============================================================== RESTAURANT
R = dict(i0="1517248135467-4c7edcad34c4", plate="1414235077428-338989a2e8c0", i2="1555396273-367ea4eb4db5", dishes="1504674900247-0877df9cc836",
         salad="1546069901-ba9599a7e63c", pizza="1565299624946-b28f40a0ae38", terrace="1559339352-11d035aa65de", cafe="1501339847302-ac426a4a7cbb",
         coffee="1495474472287-4d71bcdd2085", cafe2="1554118811-1e0d58224f24", pancake="1567620905732-2d1ec7ab7445", salad2="1540189549336-e6e99c3679fe",
         bowl="1512621776951-a57141f2eefd", eggs="1482049016688-2d3e1b311543")
cats, photos = gallery([("ambience", "Ambience"), ("food", "Food")],
                       [("Main dining hall", R["i0"], "ambience"), ("Rooftop terrace", R["terrace"], "ambience"), ("Chef's special plate", R["plate"], "food"),
                        ("Wood-fired pizza", R["pizza"], "food"), ("Cafe corner", R["cafe2"], "ambience"), ("Healthy bowls", R["bowl"], "food")])
DATA["restaurant"] = {
    "settings": {"site_name": "The Saffron Table", "tagline": "Slow-cooked flavours, warm hospitality",
                 "about_short": "<p>Since 2012 The Saffron Table has served hand-crafted North Indian and continental dishes made with farm-fresh ingredients, in a cosy space made for long conversations.</p>",
                 "phone": "+91 98100 22334", "email": "hello@saffrontable.in", "address": "14 Khan Market, New Delhi 110003",
                 "opening_hours": "Mon – Fri: 12 PM – 11 PM\nSat – Sun: 9 AM – 12 AM", "cta_text": "Book a Table", "cta_link": "/contact",
                 "footer_text": "Fresh food, good mood. Reservations recommended on weekends."},
    "modules": {
        "sliders": sliders(("A table full of stories", "Seasonal menus cooked slow and served with love.", R["i0"]),
                           ("Weekend brunch is here", "Fluffy pancakes, eggs your way and bottomless coffee.", R["pancake"]),
                           ("Rooftop evenings", "Live music every Friday under the stars.", R["terrace"])),
        "catalog_items": catalog(
            ("Paneer Tikka Platter", "Starters", "₹420", None, R["dishes"], "Chef's Pick", None, "Serves 2", "Char-grilled cottage cheese, mint chutney, pickled onions."),
            ("Burrata & Heirloom Salad", "Starters", "₹480", None, R["salad2"], None, None, "Veg", "Creamy burrata, tomatoes, basil oil, sourdough crisps."),
            ("Margherita Wood-fired Pizza", "Mains", "₹560", "₹620", R["pizza"], "Best Seller", None, "12 inch", "San Marzano tomato, mozzarella, fresh basil."),
            ("Smoked Butter Chicken", "Mains", "₹640", None, R["plate"], None, None, "With garlic naan", "Tandoor-smoked chicken in silky makhani gravy."),
            ("Buddha Power Bowl", "Healthy", "₹450", None, R["bowl"], "Vegan", None, "520 kcal", "Quinoa, roasted veggies, chickpeas, tahini dressing."),
            ("Classic Pancake Stack", "Brunch", "₹390", None, R["pancake"], None, None, "Weekends", "Maple syrup, berries and whipped butter."),
            ("Avocado Eggs Benedict", "Brunch", "₹420", None, R["eggs"], None, None, None, "Poached eggs, hollandaise, smashed avocado on toast."),
            ("Single-origin Cappuccino", "Beverages", "₹220", None, R["coffee"], None, None, None, "Coorg beans, velvety micro-foam.")),
        "services": services(("Private Dining", "Users", "Celebrate birthdays and anniversaries in our private room for up to 20 guests.", None, R["i2"]),
                             ("Outdoor Catering", "Truck", "Our chefs bring the Saffron experience to your events.", None, R["dishes"]),
                             ("Live Music Nights", "Music", "Acoustic sets every Friday and Saturday on the terrace.", None, R["terrace"])),
        "team_members": team(("Arjun Mehra", "Head Chef", "15 years across Mumbai and London kitchens."),
                             ("Sara D'Souza", "Pastry Chef", "Makes the city's most talked-about cheesecake."),
                             ("Vikram Rao", "Sous Chef", "Tandoor master and spice whisperer.")),
        "testimonials": testi(("Best butter chicken in town", "Neha Kapoor", "Food blogger", "The smoked butter chicken is unreal. Lovely staff and cosy vibe."),
                              ("Perfect brunch spot", "Rohan Gupta", "Regular guest", "Pancakes + cappuccino on the terrace = my Sunday ritual."),
                              ("Great for celebrations", "Ananya Iyer", "Hosted a birthday", "Private dining room was beautifully decorated. Highly recommend!")),
        "stats": stats(("Happy guests", "50K+", "Smile"), ("Dishes on menu", "80+", "Utensils"), ("Years of taste", "12", "Award"), ("Google rating", "4.8★", "Star")),
        "faqs": faq(("Do you take reservations?", "Yes — call us or use the Book a Table button. Weekends fill up fast."),
                    ("Do you have vegan options?", "Plenty! Look for the Vegan badge on the menu."),
                    ("Is parking available?", "Valet parking is available from 7 PM onwards.")),
        "partners": partners("Zomato", "Swiggy", "EazyDiner", "Dineout", "Times Food"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("The secret behind our butter chicken", "secret-butter-chicken", "Chef Arjun", "2026-10-05", R["plate"],
                        "It starts with a 24-hour marinade and ends in a tandoor kissed with charcoal.", "We smoke the chicken over charcoal, then finish it in a gravy made from slow-roasted tomatoes and cultured butter.", "recipes,chef"),
                       ("Weekend brunch menu launched", "weekend-brunch", "Team Saffron", "2026-09-20", R["pancake"],
                        "Pancakes, eggs benedict and cold brews — brunch is served every Saturday and Sunday.", "Join us from 9 AM to 1 PM. Kids under 6 eat free.", "news"))},
}

# ============================================================== GYM
G = dict(gym="1534438327276-14e5300c3a48", abs="1571019613454-1cb2f99b2d8b", barbell="1517836357463-d25dfeac3438", room="1540497077202-7c8a3999166f",
         db="1583454110551-21f2fa2afe61", bw="1574680096145-d05b474e2155", group="1518611012118-696072aa579a", yoga="1544367567-0f2fcb009e0b",
         ropes="1599058917212-d750089bc07e")
cats, photos = gallery([("floor", "Gym Floor"), ("classes", "Classes")],
                       [("Free weights zone", G["gym"], "floor"), ("Cardio deck", G["room"], "floor"), ("Power lifting", G["barbell"], "floor"),
                        ("HIIT circuit", G["ropes"], "classes"), ("Group workout", G["group"], "classes"), ("Sunrise yoga", G["yoga"], "classes")])
DATA["gym"] = {
    "settings": {"site_name": "Iron Pulse Fitness", "tagline": "Stronger every single day",
                 "about_short": "<p>Iron Pulse is a 12,000 sq ft performance gym with certified coaches, modern equipment and a community that pushes you to be your best.</p>",
                 "phone": "+91 99887 66554", "email": "join@ironpulse.fit", "address": "2nd Floor, Phoenix Mall, Pune 411014",
                 "opening_hours": "Mon – Sat: 5 AM – 11 PM\nSunday: 7 AM – 1 PM", "cta_text": "Start Free Trial", "cta_link": "/contact",
                 "footer_text": "No excuses. Just results."},
    "modules": {
        "sliders": sliders(("Train like an athlete", "Strength, conditioning and coaching under one roof.", G["barbell"]),
                           ("Burn it in 45 minutes", "High-energy HIIT classes every hour.", G["ropes"]),
                           ("Find your balance", "Yoga & mobility sessions for body and mind.", G["yoga"])),
        "services": services(("Strength Training", "Dumbbell", "Progressive programs to build muscle and power safely.", "Daily", G["gym"]),
                             ("HIIT & Functional", "Zap", "Fat-burning circuits with ropes, sleds and kettlebells.", "45 min", G["ropes"]),
                             ("Yoga & Mobility", "Leaf", "Improve flexibility, posture and breathing.", "60 min", G["yoga"]),
                             ("Personal Training", "Target", "1-on-1 coaching with nutrition guidance.", "From ₹6,000/mo", G["abs"])),
        "pricing_plans": plans(("Basic", "₹1,499", "/month", ["Gym floor access", "Locker & shower", "1 fitness assessment"], False, "Join Basic"),
                               ("Pro", "₹2,999", "/month", ["Everything in Basic", "Unlimited group classes", "Monthly body-composition scan", "Diet plan"], True, "Go Pro"),
                               ("Elite", "₹7,999", "/month", ["Everything in Pro", "12 personal training sessions", "Recovery zone access"], False, "Go Elite")),
        "team_members": team(("Karan Singh", "Head Coach", "NSCA certified, 10 years coaching athletes."),
                             ("Priya Nair", "Yoga Instructor", "RYT-500, specialises in mobility."),
                             ("Rahul Verma", "HIIT Coach", "Former national-level sprinter."),
                             ("Meera Joshi", "Nutritionist", "Builds sustainable meal plans.")),
        "testimonials": testi(("Lost 12 kg in 4 months", "Amit Shah", "Member since 2024", "The coaches tracked everything. Best decision I made this year."),
                              ("Amazing community", "Sneha Patil", "Pro member", "Group classes are so much fun — I never miss a session."),
                              ("World-class equipment", "Rahul Desai", "Powerlifter", "Calibrated plates, proper racks. A lifter's dream gym.")),
        "stats": stats(("Active members", "1,200+", "Users"), ("Expert coaches", "18", "Award"), ("Classes / week", "60+", "Clock"), ("Sq ft space", "12K", "Dumbbell")),
        "faqs": faq(("Is there a free trial?", "Yes, a 3-day free pass with one coached session."), ("Can I freeze my membership?", "Pro and Elite members can freeze up to 30 days a year."),
                    ("Do you have women-only batches?", "Yes, 7–8 AM and 6–7 PM every weekday.")),
        "partners": partners("MuscleBlaze", "Decathlon", "Cult Sport", "Optimum Nutrition", "Garmin"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("5 mistakes beginners make in the gym", "beginner-mistakes", "Coach Karan", "2026-10-10", G["db"],
                        "Skipping warm-ups and ego lifting top the list.", "Start light, learn form, sleep 8 hours and eat enough protein.", "training,tips"),
                       ("Why mobility matters", "why-mobility", "Priya Nair", "2026-09-28", G["yoga"], "Mobility keeps you lifting for decades.",
                        "Ten minutes a day of hip and shoulder work makes every lift better.", "yoga"))},
}

# ============================================================== REAL ESTATE
E = dict(pool="1600596542815-ffad4c1539a9", modern="1600585154340-be6161a56a0c", villa="1564013799919-ab600027ffc6", lux="1512917774080-9991f1c4c750",
         living="1600607687939-ce8a6c25118c", house="1580587771525-78b9dba3b914", keys="1560518883-ce09059eeffa", night="1568605114967-8130f3a36994")
cats, photos = gallery([("exteriors", "Exteriors"), ("interiors", "Interiors")],
                       [("Infinity pool villa", E["pool"], "exteriors"), ("Contemporary home", E["modern"], "exteriors"), ("Garden villa", E["villa"], "exteriors"),
                        ("Open living room", E["living"], "interiors"), ("Evening facade", E["night"], "exteriors"), ("Luxury estate", E["lux"], "exteriors")])
DATA["real_estate"] = {
    "settings": {"site_name": "Prime Nest Realty", "tagline": "Find a home you'll love coming back to",
                 "about_short": "<p>Prime Nest Realty helps families and investors buy, sell and rent premium homes across Bengaluru with complete legal and loan support.</p>",
                 "phone": "+91 80 4567 8910", "email": "homes@primenest.in", "address": "Level 5, UB City, Vittal Mallya Road, Bengaluru 560001",
                 "cta_text": "Schedule a Visit", "cta_link": "/contact", "footer_text": "RERA registered. Trusted by 2,000+ families."},
    "modules": {
        "sliders": sliders(("Luxury villas with private pools", "Handpicked properties in Bengaluru's finest neighbourhoods.", E["pool"]),
                           ("Modern homes, smart prices", "Ready-to-move 3 & 4 BHK homes from ₹1.2 Cr.", E["modern"]),
                           ("Your keys are waiting", "Zero-brokerage on select new launches this month.", E["keys"])),
        "catalog_items": catalog(
            ("Skyline Infinity Villa", "Villa", "₹4.8 Cr", None, E["pool"], "For Sale", "Whitefield, Bengaluru", "5 Beds · 6 Baths · 6,200 sqft", "Private infinity pool, home theatre, landscaped garden."),
            ("Cedar Modern Residence", "Independent House", "₹2.1 Cr", "₹2.4 Cr", E["modern"], "Price Drop", "HSR Layout", "4 Beds · 4 Baths · 3,400 sqft", "Floor-to-ceiling glass and a courtyard garden."),
            ("Palm Grove Villa", "Villa", "₹3.6 Cr", None, E["villa"], "New Launch", "Sarjapur Road", "4 Beds · 5 Baths · 4,800 sqft", "Gated community with clubhouse and pool."),
            ("The Lumina Estate", "Luxury", "₹9.5 Cr", None, E["lux"], "Exclusive", "Koramangala", "6 Beds · 7 Baths · 9,000 sqft", "An architectural landmark with a rooftop lounge."),
            ("Maple Family Home", "Independent House", "₹1.35 Cr", None, E["house"], "Ready to Move", "Electronic City", "3 Beds · 3 Baths · 2,200 sqft", "Quiet street, near schools and metro."),
            ("Twilight Cottage", "Rent", "₹85,000/mo", None, E["night"], "For Rent", "Indiranagar", "3 Beds · 3 Baths · 2,600 sqft", "Fully furnished, pet friendly.")),
        "services": services(("Buy a Home", "Home", "Verified listings, site visits and price negotiation.", None, None),
                             ("Sell Your Property", "TrendingUp", "Professional photos, marketing and qualified buyers.", None, None),
                             ("Home Loans", "Briefcase", "Tie-ups with 12 banks for the best interest rates.", None, None),
                             ("Legal & Registration", "Shield", "Title checks, agreements and registration handled.", None, None)),
        "team_members": team(("Rajesh Kumar", "Founder & CEO", "20 years in Bengaluru real estate."), ("Aisha Khan", "Senior Agent", "Luxury villa specialist."),
                             ("Vivek Menon", "Property Advisor", "Investment and NRI deals."), ("Pooja Reddy", "Legal Head", "Property law expert.")),
        "projects": projects(("Prime Nest Greens", "Township", "Prime Nest", "Devanahalli", E["villa"], "2025-12-01", "120 villa plots with clubhouse and lake view."),
                             ("Urban Heights", "Apartments", "Prime Nest", "Hebbal", E["modern"], "2026-03-15", "Premium 3 BHK towers next to the metro.")),
        "testimonials": testi(("Smooth home buying", "Kiran Rao", "Bought in Whitefield", "From site visits to registration, everything was transparent."),
                              ("Sold in 3 weeks", "Deepa Sharma", "Seller", "Their photos and marketing got us 15 serious buyers."),
                              ("Great for NRIs", "Arun Pillai", "Dubai", "Managed the whole purchase remotely. Very professional.")),
        "stats": stats(("Homes sold", "2,000+", "Home"), ("Happy families", "1,800", "Smile"), ("Years experience", "20", "Award"), ("Partner banks", "12", "Building2")),
        "faqs": faq(("Do you charge brokerage?", "Zero brokerage on new launches; 1% on resale properties."), ("Are listings verified?", "Every property is legally verified before listing."),
                    ("Can you help with loans?", "Yes, we work with 12 banks and get you pre-approved.")),
        "partners": partners("HDFC Bank", "SBI Home Loans", "Prestige", "Sobha", "Brigade"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("Top 5 areas to buy in Bengaluru in 2026", "top-areas-2026", "Rajesh Kumar", "2026-10-02", E["modern"], "Metro lines are reshaping prices.",
                        "Whitefield, Hebbal, Sarjapur, Devanahalli and HSR lead our list.", "market"),
                       ("Checklist before buying a resale flat", "resale-checklist", "Pooja Reddy", "2026-09-15", E["keys"], "Title, OC and society dues — check them all.",
                        "Always ask for the encumbrance certificate for 30 years.", "legal"))},
}

# ============================================================== HOSPITAL
H = dict(rec="1519494026892-80bbd2d6fd0d", doc="1576091160399-112ba8d25d1d", surgery="1579684385127-1ef15d508118", ot="1551076805-e1869033e561",
         patient="1631217868264-e5b90bb7e133", docman="1612349317150-e413f6a5b16d", steth="1584982751601-97dcc096659c", ward="1538108149393-fbbd81895907")
cats, photos = gallery([("facility", "Facilities")],
                       [("Reception & lobby", H["rec"], "facility"), ("Modern OT", H["ot"], "facility"), ("Patient wards", H["ward"], "facility"),
                        ("Consultation", H["patient"], "facility"), ("Surgical team", H["surgery"], "facility"), ("Diagnostics", H["steth"], "facility")])
DATA["hospital"] = {
    "settings": {"site_name": "CarePlus Multispeciality Hospital", "tagline": "Compassionate care, advanced medicine",
                 "about_short": "<p>CarePlus is a 150-bed NABH accredited hospital offering 24×7 emergency care, advanced surgery and preventive health programs.</p>",
                 "phone": "+91 22 6123 4567", "email": "care@careplus.in", "address": "Plot 8, Sector 17, Vashi, Navi Mumbai 400703",
                 "opening_hours": "Emergency: 24 × 7\nOPD: Mon – Sat, 9 AM – 8 PM", "cta_text": "Book Appointment", "cta_link": "/contact",
                 "footer_text": "In an emergency call 1066 — our ambulance reaches you fast."},
    "modules": {
        "sliders": sliders(("Healthcare you can trust", "150 beds · 40 specialists · 24×7 emergency.", H["rec"]),
                           ("Advanced surgical care", "Modular OTs and minimally invasive procedures.", H["ot"]),
                           ("Doctors who listen", "Book an OPD appointment in under a minute.", H["patient"])),
        "services": services(("Cardiology", "HeartPulse", "ECG, echo, angiography and cardiac surgery.", None, None), ("Orthopaedics", "Shield", "Joint replacement and sports injury care.", None, None),
                             ("Paediatrics", "Baby", "Newborn and child care with a gentle touch.", None, None), ("Neurology", "Lightbulb", "Stroke, epilepsy and headache clinics.", None, None),
                             ("Gynaecology", "Heart", "Maternity, fertility and women's health.", None, None), ("Emergency & Trauma", "Clock", "24×7 ICU-equipped emergency unit.", None, None)),
        "team_members": team(("Dr. Anil Deshmukh", "Chief Cardiologist", "MD, DM Cardiology · 22 years"), ("Dr. Kavita Shah", "Gynaecologist", "MS OBG · 15 years"),
                             ("Dr. Sameer Joshi", "Orthopaedic Surgeon", "MS Ortho · Joint replacement"), ("Dr. Ritu Agarwal", "Paediatrician", "MD Paediatrics · 12 years")),
        "pricing_plans": plans(("Basic Health Check", "₹1,499", "one time", ["CBC, sugar, lipid profile", "Doctor consultation", "Report in 24 hrs"], False, "Book Now"),
                               ("Comprehensive", "₹3,999", "one time", ["60+ tests", "ECG & chest X-ray", "Diet consultation", "Free follow-up"], True, "Book Now"),
                               ("Senior Citizen", "₹4,999", "one time", ["Cardiac risk panel", "Bone density scan", "Eye & ENT check"], False, "Book Now")),
        "testimonials": testi(("Saved my father's life", "Prakash Jain", "Cardiac patient's son", "Quick emergency response and an excellent cardiology team."),
                              ("Caring maternity staff", "Shruti Kulkarni", "New mother", "Felt safe and supported throughout. Thank you CarePlus!"),
                              ("Clean and efficient", "Imran Shaikh", "OPD patient", "No long waiting, and the doctors explain everything clearly.")),
        "stats": stats(("Beds", "150", "Bed"), ("Specialists", "40+", "Stethoscope"), ("Patients treated", "2L+", "HeartPulse"), ("Emergency", "24×7", "Clock")),
        "faqs": faq(("How do I book an appointment?", "Call us or use the Book Appointment button — we confirm within 30 minutes."),
                    ("Do you accept insurance?", "Cashless treatment with 30+ insurers and TPAs."), ("Is there a pharmacy?", "Yes, a 24×7 in-house pharmacy.")),
        "partners": partners("Star Health", "HDFC Ergo", "ICICI Lombard", "NABH", "Apollo Labs"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("Know the warning signs of a heart attack", "heart-attack-signs", "Dr. Anil Deshmukh", "2026-10-12", H["steth"], "Chest pain is not the only symptom.",
                        "Breathlessness, jaw pain and sweating need urgent attention. Call 1066 immediately.", "cardiology"),
                       ("Monsoon health tips for kids", "monsoon-kids", "Dr. Ritu Agarwal", "2026-08-20", H["patient"], "Clean water and timely vaccines prevent most infections.",
                        "Keep kids hydrated and avoid street food during the rains.", "paediatrics"))},
}

# ============================================================== SCHOOL
S = dict(cls="1580582932707-520aed937b7b", apple="1503676260728-1c00da094a0b", kids="1509062522246-3755977927d7", lib="1427504494785-3a9ca7044f45",
         books="1497633762265-9d179a990aa6", love="1546410531-bb4caa6b424d", draw="1588072432836-e10032774350")
cats, photos = gallery([("campus", "Campus"), ("events", "Events")],
                       [("Smart classrooms", S["cls"], "campus"), ("Library", S["lib"], "campus"), ("Art class", S["draw"], "events"),
                        ("Group learning", S["kids"], "events"), ("Reading corner", S["books"], "campus"), ("Love to learn", S["love"], "events")])
DATA["school"] = {
    "settings": {"site_name": "Sunrise Public School", "tagline": "Learn · Lead · Inspire",
                 "about_short": "<p>Sunrise Public School is a co-educational CBSE school offering a balanced education that combines academic excellence with sports, arts and values.</p>",
                 "phone": "+91 98765 43210", "email": "info@sunriseschool.in", "address": "12 Knowledge Park, New Delhi 110001", "affiliation_no": "2730145",
                 "cta_text": "Admissions Open", "cta_link": "/contact", "footer_text": "Affiliated to CBSE, New Delhi."},
    "modules": {
        "sliders": sliders(("Welcome to Sunrise", "Nurturing curious minds since 1985 — where every child shines.", S["kids"]),
                           ("Admissions Open 2026-27", "Limited seats for Nursery to Class IX. Apply online today.", S["cls"]),
                           ("A library of 20,000 books", "Reading opens every door.", S["lib"]),
                           ("Every child is an artist", "Art, music and dance are part of every school day.", S["draw"]),
                           ("Love to learn", "Curious minds, caring teachers, happy classrooms.", S["love"])),
        "thoughts": [{"title": "Thought of the Day", "description": "Education is not the filling of a pail, but the lighting of a fire.", "thought_date": "2026-10-29"}],
        "services": services(("Smart Classrooms", "Lightbulb", "Interactive boards in every classroom.", None, None), ("Science & Robotics Labs", "Rocket", "Hands-on STEM learning.", None, None),
                             ("Sports Complex", "Trophy", "Cricket, football, swimming and skating.", None, None), ("Safe Transport", "Truck", "GPS-tracked buses with attendants.", None, None)),
        "team_members": team(("Mrs. Sunita Sharma", "Principal", "M.Ed · 25 years in education."), ("Mr. Rakesh Verma", "Vice Principal", "Physics · 18 years."),
                             ("Ms. Fatima Ali", "Head of Primary", "Early-childhood specialist."), ("Mr. John Mathew", "Sports Director", "Former state-level athlete.")),
        "achievements": [{"title": "100% Board Results", "achievement_date": "2026-05-20", "image": u(S["books"]), "description": "<p>All Class X and XII students passed with distinction.</p>"},
                         {"title": "State Science Olympiad Winners", "achievement_date": "2026-02-11", "image": u(S["kids"]), "description": "<p>Gold and silver at the state level.</p>"},
                         {"title": "Green School Award", "achievement_date": "2025-12-05", "image": u(S["love"]), "description": "<p>Recognised for sustainability.</p>"}],
        "award_categories": [{"_key": "academic", "title": "Academic"}, {"_key": "sports", "title": "Sports"}],
        "awards": [{"title": "Best CBSE School — North Zone", "category_id": "@academic", "award_date": "2026-08-15", "image": u(S["cls"]), "description": "<p>Awarded by Education Today for academic excellence.</p>"},
                   {"title": "Inter-school Football Champions", "category_id": "@sports", "award_date": "2026-01-20", "image": u(S["kids"]), "description": "<p>Under-14 team won the district cup.</p>"},
                   {"title": "National Spelling Bee — Gold", "category_id": "@academic", "award_date": "2025-11-10", "image": u(S["books"]), "description": "<p>Riya (Class 6) took the top prize.</p>"}],
        "activities": [{"title": "Inter-house Debate Competition", "activity_date": "2026-10-10", "image": u(S["lib"]), "description": "<p>Topic: Technology in classrooms.</p>"},
                       {"title": "Art & Craft Week", "activity_date": "2026-09-18", "image": u(S["draw"]), "description": "<p>500 artworks exhibited by students.</p>"}],
        "press_releases": [{"title": "School wins National Robotics Challenge", "release_date": "2026-10-20", "description": "<p>Our Class 9 team beat 120 schools in the final round.</p>"},
                           {"title": "New smart classrooms inaugurated", "release_date": "2026-09-05", "description": "<p>All 60 classrooms now have interactive panels.</p>"}],
        "tenders": [{"title": "Supply of sports equipment", "tender_no": "T-2026/14", "start_date": "2026-10-20", "end_date": "2026-11-10"}],
        "testimonials": testi(("Wonderful teachers", "Mrs. Sharma", "Parent of Aarav, Class 5", "The teachers know every child personally. My son loves school!"),
                              ("All-round growth", "Mr. Khan", "Parent of Zoya, Class 8", "Academics, sports and arts — the balance is excellent."),
                              ("Safe and caring", "Mrs. Iyer", "Parent of Diya, Class 2", "Transport, security and communication are handled very well.")),
        "stats": stats(("Students", "2,400+", "Users"), ("Teachers", "120", "GraduationCap"), ("Years of excellence", "40", "Award"), ("Board results", "100%", "Trophy")),
        "faqs": faq(("When do admissions start?", "Registrations open every December for the next session."), ("Is transport available?", "Yes, buses cover a 15 km radius."),
                    ("What is the student-teacher ratio?", "1:20 in all classes.")),
        "partners": partners("CBSE", "British Council", "Atal Tinkering Lab", "NCC", "Khelo India"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("How we make learning joyful", "joyful-learning", "Principal", "2026-10-15", S["draw"], "Activity-based learning, small classes and caring teachers.",
                        "A look inside our classrooms, from robotics to theatre.", "academics"),
                       ("Annual Day 2026 highlights", "annual-day-2026", "Admin", "2026-09-30", S["kids"], "Dance, drama and music lit up the stage.",
                        "Over 600 students performed in front of 2,000 parents.", "events"))},
}

# ============================================================== COACHING
C = dict(group="1522202176988-66273c2fd55f", lecture="1524178232363-1fb2b075b655", laptop="1513258496099-48168024aec0", writing="1434030216411-0b793f4b4173",
         books="1456513080510-7bf3a84b82f8", desk="1501504905252-473c47e087f8")
cats, photos = gallery([("classroom", "Classrooms")],
                       [("Lecture hall", C["lecture"], "classroom"), ("Doubt sessions", C["group"], "classroom"), ("Self study zone", C["desk"], "classroom"),
                        ("Test practice", C["writing"], "classroom"), ("Library", C["books"], "classroom"), ("Online classes", C["laptop"], "classroom")])
DATA["coaching"] = {
    "settings": {"site_name": "Achievers Academy", "tagline": "IIT-JEE · NEET · Foundation",
                 "about_short": "<p>Achievers Academy has guided 15,000+ students to top engineering and medical colleges with expert faculty, small batches and weekly tests.</p>",
                 "phone": "+91 141 400 5000", "email": "admissions@achievers.in", "address": "Indra Vihar, Kota, Rajasthan 324005",
                 "cta_text": "Book Free Demo Class", "cta_link": "/contact", "footer_text": "Results that speak for themselves."},
    "modules": {
        "sliders": sliders(("Crack JEE & NEET with India's best", "Small batches. Weekly tests. Personal mentoring.", C["lecture"]),
                           ("New batches from 1st November", "Limited seats — scholarship test this Sunday.", C["group"]),
                           ("Learn anywhere", "Live + recorded classes on our app.", C["laptop"])),
        "services": services(("IIT-JEE (Main + Advanced)", "Rocket", "2-year classroom program for Class 11 & 12.", "2 years", C["lecture"]),
                             ("NEET UG", "Stethoscope", "Biology-focused program with NCERT mastery.", "2 years", C["books"]),
                             ("Foundation (Class 8–10)", "BookOpen", "Build concepts early for Olympiads and boards.", "1 year", C["writing"]),
                             ("Crash Course", "Zap", "60-day revision with full-length mock tests.", "60 days", C["desk"])),
        "pricing_plans": plans(("Foundation", "₹45,000", "/year", ["Class 8–10 batches", "Weekly tests", "Study material"], False, "Enquire"),
                               ("JEE / NEET Classroom", "₹1,35,000", "/year", ["Expert faculty", "Daily doubt sessions", "All India test series", "Mentor support"], True, "Enquire"),
                               ("Online Live", "₹55,000", "/year", ["Live classes on app", "Recorded lectures", "Online tests"], False, "Enquire")),
        "team_members": team(("Er. Rajiv Malhotra", "Director · Physics", "IIT Bombay, 18 years teaching."), ("Dr. Neha Gupta", "Biology Head", "MBBS, AIIMS Delhi."),
                             ("Mr. Suresh Iyer", "Mathematics", "IIT Madras, author of 3 books."), ("Ms. Anjali Rao", "Chemistry", "M.Sc, 10 years teaching.")),
        "achievements": [{"title": "AIR 12 in JEE Advanced 2026", "achievement_date": "2026-06-10", "image": u(C["group"]), "description": "<p>Aditya Sharma, classroom student.</p>"},
                         {"title": "312 NEET qualifiers", "achievement_date": "2026-06-14", "image": u(C["books"]), "description": "<p>Our best result ever.</p>"},
                         {"title": "48 students in Top 1000", "achievement_date": "2026-06-10", "image": u(C["lecture"]), "description": "<p>JEE Advanced 2026.</p>"}],
        "testimonials": testi(("Mentors made the difference", "Aditya Sharma", "AIR 12, JEE Adv 2026", "Weekly tests and doubt sessions kept me on track."),
                              ("Biology made easy", "Riya Sen", "NEET 2026 — 690/720", "Dr. Neha's notes are pure gold."),
                              ("Best decision for my son", "Mr. Bansal", "Parent", "Regular updates and caring teachers.")),
        "stats": stats(("Selections", "15,000+", "Trophy"), ("Expert faculty", "85", "GraduationCap"), ("Top 100 ranks", "120", "Award"), ("Years", "16", "Clock")),
        "faqs": faq(("Is there a scholarship test?", "Yes — up to 90% fee waiver based on the ASAT test."), ("Do you provide hostel?", "Separate boys' and girls' hostels near campus."),
                    ("Can I attend a demo class?", "Yes, book a free demo class anytime.")),
        "partners": partners("NTA Pattern", "Physics Wallah Books", "Unacademy", "Byju's Tests", "Allen Modules"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("How to plan the last 90 days before JEE", "jee-90-days", "Er. Rajiv Malhotra", "2026-10-01", C["desk"], "Revise, test, analyse — repeat.",
                        "Give at least 3 full mocks a week and keep an error notebook.", "jee,strategy"))},
}

# ============================================================== BUSINESS
B = dict(office="1497366216548-37526070297c", glass="1497366811353-6870744d04b2", team="1522071820081-009f0129c71c", meet="1556761175-5973dc0f32e7",
         towers="1486406146926-c627a92ad1ab", notes="1552664730-d307ca884978", high5="1600880292203-757bb62b4baf", work="1454165804606-c3d57bc86b40")
cats, photos = gallery([("office", "Our Office")],
                       [("Headquarters", B["towers"], "office"), ("Workspace", B["office"], "office"), ("Team huddle", B["notes"], "office"),
                        ("Client meeting", B["meet"], "office"), ("Celebrating wins", B["high5"], "office"), ("Collaboration", B["team"], "office")])
DATA["business"] = {
    "settings": {"site_name": "Vertex Solutions", "tagline": "Technology that grows your business",
                 "about_short": "<p>Vertex Solutions is an IT services company helping 300+ businesses modernise with cloud, ERP and custom software since 2010.</p>",
                 "phone": "+91 40 4000 1234", "email": "contact@vertexsolutions.in", "address": "Cyber Towers, HITEC City, Hyderabad 500081",
                 "cta_text": "Get a Free Consultation", "cta_link": "/contact", "footer_text": "ISO 9001:2015 & 27001 certified."},
    "modules": {
        "sliders": sliders(("Build. Scale. Succeed.", "Software, cloud and consulting for ambitious companies.", B["towers"]),
                           ("Your digital transformation partner", "From strategy to delivery in weeks, not months.", B["team"]),
                           ("People-first technology", "300+ clients across 12 countries.", B["high5"])),
        "services": services(("Cloud Migration", "Globe", "Move to AWS or Azure with zero downtime.", None, B["glass"]), ("Custom Software", "Code", "Web and mobile apps built for your workflow.", None, B["work"]),
                             ("ERP Implementation", "Package", "SAP and Odoo setup, training and support.", None, B["office"]), ("IT Consulting", "Lightbulb", "Roadmaps and audits from senior architects.", None, B["meet"])),
        "team_members": team(("Sanjay Reddy", "Founder & CEO", "Ex-Infosys, 25 years in IT."), ("Lakshmi Narayan", "CTO", "Cloud architect, AWS certified."),
                             ("Farhan Qureshi", "Head of Sales", "Builds long-term client relationships."), ("Divya Menon", "HR Director", "Culture and talent.")),
        "projects": projects(("Retail ERP for FreshMart", "ERP", "FreshMart", "Hyderabad", B["work"], "2026-06-01", "Unified inventory and billing for 120 stores."),
                             ("Cloud move for MediCore", "Cloud", "MediCore Labs", "Pune", B["glass"], "2026-03-10", "Migrated 40 servers to AWS, cutting costs 35%."),
                             ("Logistics app for ShipFast", "Software", "ShipFast", "Mumbai", B["team"], "2025-11-20", "Real-time tracking app with 50K daily users.")),
        "catalog_items": catalog(("VertexHR Suite", "Product", "₹199/user/mo", None, B["office"], "New", None, "Cloud · Mobile app", "Payroll, attendance and leave in one place."),
                                 ("VertexPOS", "Product", "₹2,999/mo", None, B["work"], None, None, "Offline-first", "Billing and inventory for retail.")),
        "testimonials": testi(("Delivered ahead of schedule", "Ravi Agarwal", "CEO, FreshMart", "Our ERP went live 2 weeks early. Fantastic team."),
                              ("Reliable cloud partner", "Shalini Gupta", "CTO, MediCore", "Zero downtime migration and great support."),
                              ("Truly understands business", "Mark Williams", "Director, ShipFast UK", "They think like owners, not vendors.")),
        "stats": stats(("Clients", "300+", "Briefcase"), ("Projects delivered", "850", "Rocket"), ("Countries", "12", "Globe"), ("Team members", "220", "Users")),
        "faqs": faq(("Do you work with startups?", "Yes — we have special packages for early-stage startups."), ("Where are you based?", "Hyderabad HQ, with teams in Pune and Dubai."),
                    ("How do engagements work?", "Fixed price for defined scope, or monthly dedicated teams.")),
        "partners": partners("AWS", "Microsoft", "SAP", "Odoo", "Google Cloud", "Salesforce"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("5 signs your business needs an ERP", "need-erp", "Sanjay Reddy", "2026-10-08", B["work"], "Spreadsheets everywhere is sign number one.",
                        "If month-end closing takes a week, it's time.", "erp"))},
}

# ============================================================== AGENCY
A = dict(analytics="1460925895917-afdab827c52f", board="1557804506-669a67965ba0", desk="1533750349088-cd871a92f312", dev="1551434678-e076c223a692",
         meet="1542744173-8e7e53415bb0", social="1611162617474-5b21e879e113")
cats, photos = gallery([("studio", "Studio")],
                       [("Strategy sessions", A["board"], "studio"), ("Data-driven", A["analytics"], "studio"), ("Creative desk", A["desk"], "studio"),
                        ("Dev team", A["dev"], "studio"), ("Client workshop", A["meet"], "studio"), ("Teamwork", "1522071820081-009f0129c71c", "studio")])
DATA["agency"] = {
    "settings": {"site_name": "GrowthLab Digital", "tagline": "We turn clicks into customers",
                 "about_short": "<p>GrowthLab is a performance marketing agency. SEO, ads, social and content — measured in revenue, not likes.</p>",
                 "phone": "+91 98200 12345", "email": "hello@growthlab.agency", "address": "WeWork BKC, Mumbai 400051",
                 "cta_text": "Get a Free Audit", "cta_link": "/contact", "footer_text": "Google Premier Partner · Meta Business Partner"},
    "modules": {
        "sliders": sliders(("Marketing that pays for itself", "Average 4.2× ROAS across 150+ brands.", A["analytics"]),
                           ("Ideas that get noticed", "Creative campaigns powered by data.", A["board"]),
                           ("Grow on every channel", "Search, social, email and beyond.", A["meet"])),
        "services": services(("SEO", "TrendingUp", "Rank higher and win organic traffic that converts.", "From ₹25,000/mo", None),
                             ("Performance Ads", "Target", "Google & Meta ads optimised for ROAS.", "15% of ad spend", None),
                             ("Social Media", "Megaphone", "Content calendars, reels and community management.", "From ₹30,000/mo", None),
                             ("Web Design", "PenTool", "Fast, beautiful websites that convert.", "From ₹60,000", None),
                             ("Content Marketing", "BookOpen", "Blogs, videos and newsletters that build trust.", None, None),
                             ("Analytics", "Zap", "Dashboards that show what's really working.", None, None)),
        "projects": projects(("UrbanKicks: 6× ROAS", "Performance Ads", "UrbanKicks", "Delhi", A["analytics"], "2026-07-01", "Scaled D2C sneaker sales from ₹10L to ₹65L/month."),
                             ("BrewCo goes viral", "Social Media", "BrewCo", "Bengaluru", A["desk"], "2026-04-12", "A reel series with 12M views and 40K new followers."),
                             ("HealthFirst SEO", "SEO", "HealthFirst", "Chennai", A["dev"], "2025-12-01", "#1 rankings for 120 keywords in 8 months."),
                             ("EduSmart launch", "Branding", "EduSmart", "Pune", A["board"], "2025-09-15", "Brand identity and launch campaign for an ed-tech app.")),
        "pricing_plans": plans(("Starter", "₹35,000", "/month", ["SEO for 10 keywords", "8 social posts", "Monthly report"], False, "Get Started"),
                               ("Growth", "₹75,000", "/month", ["SEO for 30 keywords", "Google + Meta ads", "16 posts + 4 reels", "Weekly calls"], True, "Get Started"),
                               ("Scale", "₹1,50,000", "/month", ["Full-funnel strategy", "Dedicated team", "CRO & landing pages"], False, "Talk to us")),
        "team_members": team(("Kabir Malhotra", "Founder", "Ex-Google, growth hacker."), ("Isha Sethi", "Creative Director", "Award-winning designer."),
                             ("Nikhil Jain", "Head of Performance", "Managed ₹50Cr+ ad spend."), ("Tanya Arora", "SEO Lead", "Technical SEO nerd.")),
        "testimonials": testi(("Revenue tripled", "Rohit Bajaj", "Founder, UrbanKicks", "Best agency we've worked with. Transparent and fast."),
                              ("Creative + data", "Megha Rao", "CMO, BrewCo", "They actually understand our audience."),
                              ("Real SEO results", "Dr. Kumar", "HealthFirst", "Our clinic gets 3× more bookings from Google.")),
        "stats": stats(("Brands grown", "150+", "Rocket"), ("Avg. ROAS", "4.2×", "TrendingUp"), ("Ad spend managed", "₹50Cr", "Target"), ("Client retention", "92%", "Heart")),
        "faqs": faq(("Do you lock clients into contracts?", "No — month-to-month after the first 3 months."), ("How soon will I see results?", "Ads: 2–4 weeks. SEO: 3–6 months."),
                    ("Do you work with small businesses?", "Yes, our Starter plan is built for them.")),
        "partners": partners("Google Partner", "Meta", "Shopify", "HubSpot", "Semrush"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("The 2026 guide to Meta ads", "meta-ads-2026", "Nikhil Jain", "2026-10-11", A["analytics"], "Broad targeting + great creatives win.",
                        "Let the algorithm find buyers; spend your time on creative testing.", "ads"))},
}

# ============================================================== HOTEL / TRAVEL
T = dict(deck="1566073771259-6a8506099945", poolnight="1542314831-068cd1dbfeeb", room="1582719478250-c89cae4dc85b", room2="1631049307264-da0ec9d70304",
         beach="1507525428034-b723cf961d3e", boat="1476514525535-07fb3b4ae5f1", van="1469854523086-cc02fe5d8800", lake="1501785888041-af3ef285b470",
         resort="1520250497591-112f2f40a3f4")
cats, photos = gallery([("resort", "Resort"), ("destinations", "Destinations")],
                       [("Sunset deck", T["deck"], "resort"), ("Pool at night", T["poolnight"], "resort"), ("Tropical pool", T["resort"], "resort"),
                        ("Golden beach", T["beach"], "destinations"), ("Mountain lake", T["lake"], "destinations"), ("Road trips", T["van"], "destinations")])
DATA["hotel_travel"] = {
    "settings": {"site_name": "Azure Bay Resort & Travels", "tagline": "Wake up to paradise",
                 "about_short": "<p>A boutique beachfront resort in Goa with 48 rooms, an infinity pool and curated holiday packages across India.</p>",
                 "phone": "+91 832 270 1234", "email": "stay@azurebay.in", "address": "Candolim Beach Road, North Goa 403515",
                 "cta_text": "Book Your Stay", "cta_link": "/contact", "opening_hours": "Check-in: 2 PM\nCheck-out: 11 AM", "footer_text": "Best rate guaranteed when you book direct."},
    "modules": {
        "sliders": sliders(("Your private paradise in Goa", "Beachfront rooms, sunsets and slow mornings.", T["resort"]),
                           ("Evenings by the pool", "Cocktails, live music and starry skies.", T["poolnight"]),
                           ("Explore beyond the beach", "Handcrafted holiday packages across India.", T["lake"])),
        "catalog_items": catalog(("Ocean View Suite", "Room", "₹12,500/night", "₹15,000", T["room"], "Best Seller", "Goa", "King bed · 2 Guests · Balcony", "Floor-to-ceiling windows facing the Arabian Sea."),
                                 ("Garden Deluxe Room", "Room", "₹7,800/night", None, T["room2"], None, "Goa", "Queen bed · 2 Guests", "Peaceful garden views and a rain shower."),
                                 ("Pool Villa", "Room", "₹24,000/night", None, T["deck"], "Luxury", "Goa", "2 Bedrooms · 4 Guests · Private pool", "Your own plunge pool and butler service."),
                                 ("Kashmir Lakes Escape", "Package", "₹38,999/person", "₹45,000", T["boat"], "6N / 7D", "Srinagar · Pahalgam", "Flights · Hotels · Shikara ride", "Houseboat stay and Gulmarg gondola."),
                                 ("Himalayan Road Trip", "Package", "₹29,999/person", None, T["van"], "5N / 6D", "Manali · Leh", "Tempo traveller · Camps", "The ultimate mountain adventure."),
                                 ("Andaman Beach Bliss", "Package", "₹42,500/person", None, T["beach"], "Honeymoon", "Port Blair · Havelock", "Flights · Ferry · Scuba", "Turquoise water and white sand.")),
        "services": services(("Infinity Pool", "Sparkles", "Overlooking the sea, open 7 AM – 10 PM.", None, None), ("Spa & Wellness", "Leaf", "Ayurvedic massages and yoga.", None, None),
                             ("Beachside Dining", "Utensils", "Fresh Goan seafood and global cuisine.", None, None), ("Free Wi-Fi", "Wifi", "High-speed internet everywhere.", None, None),
                             ("Airport Transfer", "Car", "Pickup from Mopa & Dabolim airports.", None, None), ("Kids Club", "Smile", "Games and activities for little ones.", None, None)),
        "team_members": team(("Rhea Fernandes", "General Manager", "Hospitality veteran of 15 years."), ("Carlos Pinto", "Executive Chef", "Goan seafood specialist.")),
        "testimonials": testi(("Felt like home", "Ankit & Shreya", "Honeymoon, Oct 2026", "The ocean view suite was magical. Staff went out of their way."),
                              ("Perfect family trip", "The Mehta family", "Kashmir package", "Everything was organised to the minute."),
                              ("Best sunsets in Goa", "Lucy Brown", "UK traveller", "I'd come back just for the sunset deck.")),
        "stats": stats(("Rooms & villas", "48", "Bed"), ("Happy travellers", "25K+", "Smile"), ("Destinations", "40+", "Plane"), ("TripAdvisor", "4.9★", "Star")),
        "faqs": faq(("Is breakfast included?", "Yes, a buffet breakfast is included in all room rates."), ("Are pets allowed?", "Pets are welcome in garden rooms."),
                    ("What is the cancellation policy?", "Free cancellation up to 7 days before check-in.")),
        "partners": partners("MakeMyTrip", "Booking.com", "Airbnb", "TripAdvisor", "Goa Tourism"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("10 hidden beaches in North Goa", "hidden-beaches", "Rhea Fernandes", "2026-10-03", T["beach"], "Skip the crowds and find quiet sand.",
                        "Our favourites: Ashwem, Querim and Butterfly beach.", "travel,goa"))},
}

# ============================================================== LANDING
L = dict(dash="1551288049-bebda4e38f71", overhead="1519389950473-47ba0277781c", dark="1531297484001-80022131f5a1", chip="1518770660439-4636190af475")
DATA["landing"] = {
    "settings": {"site_name": "FlowDesk", "tagline": "The all-in-one workspace for fast teams",
                 "about_short": "<p>FlowDesk brings tasks, docs and chat into one beautiful app so your team ships faster with fewer meetings.</p>",
                 "phone": "+91 80 1234 5678", "email": "hi@flowdesk.app", "address": "Koramangala, Bengaluru 560034",
                 "cta_text": "Start Free — No Card Needed", "cta_link": "/contact", "footer_text": "Made with ❤ in India for teams everywhere."},
    "modules": {
        "sliders": sliders(("Work flows better here", "Tasks, docs and chat — finally in one place.", L["dash"]),
                           ("Built for remote teams", "Async updates that replace status meetings.", L["overhead"])),
        "services": services(("Smart Tasks", "CheckCircle", "Kanban, lists and timelines that update themselves.", None, None), ("Live Docs", "PenTool", "Write together in real time.", None, None),
                             ("Team Chat", "Users", "Threads linked to the work they're about.", None, None), ("Automations", "Zap", "Save hours with no-code workflows.", None, None),
                             ("Insights", "TrendingUp", "See where time actually goes.", None, None), ("Enterprise Security", "Shield", "SSO, audit logs and SOC 2.", None, None)),
        "pricing_plans": plans(("Free", "₹0", "/forever", ["Up to 5 users", "Unlimited tasks", "1 GB storage"], False, "Start Free"),
                               ("Team", "₹299", "/user/month", ["Unlimited users", "Automations", "100 GB storage", "Priority support"], True, "Try 14 days free"),
                               ("Enterprise", "Custom", "", ["SSO & SCIM", "Audit logs", "Dedicated success manager"], False, "Contact Sales")),
        "testimonials": testi(("Replaced 4 tools", "Arjun Nair", "CTO, Kitekart", "We cancelled Trello, Notion, Slack threads and a docs tool."),
                              ("Meetings down 60%", "Sophie Martin", "PM, Lumos", "Async updates changed how we work."),
                              ("Onboarding in a day", "Rahul Khanna", "Founder, Quickship", "The team was productive on day one.")),
        "stats": stats(("Teams", "12,000+", "Users"), ("Tasks completed", "40M", "CheckCircle"), ("Uptime", "99.99%", "Shield"), ("Rating", "4.9★", "Star")),
        "faqs": faq(("Is there a free plan?", "Yes, free forever for up to 5 users."), ("Can I import from Trello or Asana?", "One-click import from both."),
                    ("Is my data secure?", "Encrypted at rest and in transit, SOC 2 Type II certified."), ("Can I cancel anytime?", "Yes, no lock-in.")),
        "partners": partners("Razorpay", "Zerodha", "Freshworks", "Swiggy", "CRED", "Meesho"),
        "blogs": blogs(("How we cut our meetings in half", "fewer-meetings", "FlowDesk Team", "2026-10-06", L["overhead"], "Async-first is a habit, not a tool.",
                        "Write daily updates, record short videos and keep decisions in docs.", "productivity"))},
}

# ============================================================== PHOTOGRAPHY
PH = dict(bride="1519741497674-611481863552", ceremony="1511285560929-80b456fea0bc", rings="1465495976277-4387d4b0b4c6", couple="1606216794074-735e91aa2c92",
          polaroid="1452587925148-ce544e77e70d", lens="1516035069371-29a1b244cc32", beach="1537633552985-df8429e8048b")
cats, photos = gallery([("weddings", "Weddings"), ("prewedding", "Pre-wedding")],
                       [("The bouquet", PH["bride"], "weddings"), ("The vows", PH["ceremony"], "weddings"), ("Forever rings", PH["rings"], "weddings"),
                        ("Golden hour", PH["couple"], "prewedding"), ("By the sea", PH["beach"], "prewedding"), ("Memories", PH["polaroid"], "prewedding")])
DATA["photography"] = {
    "settings": {"site_name": "Lumière Stories", "tagline": "Wedding & portrait photography",
                 "about_short": "<p>We are a team of storytellers capturing weddings, pre-weddings and portraits across India with a candid, cinematic style.</p>",
                 "phone": "+91 98110 55667", "email": "book@lumierestories.in", "address": "Hauz Khas Village, New Delhi 110016",
                 "cta_text": "Check Availability", "cta_link": "/contact", "footer_text": "Every love story deserves to be told beautifully."},
    "modules": {
        "sliders": sliders(("Love, captured candidly", "Cinematic wedding stories across India.", PH["ceremony"]),
                           ("Golden hour magic", "Pre-wedding shoots that feel like you.", PH["couple"]),
                           ("Details that matter", "From rings to roses, we notice everything.", PH["rings"])),
        "projects": projects(("Aisha & Kabir — Udaipur", "Wedding", "Aisha & Kabir", "Udaipur", PH["ceremony"], "2026-02-14", "A three-day palace wedding by the lake."),
                             ("Riya & Dev — Goa", "Pre-wedding", "Riya & Dev", "Goa", PH["beach"], "2026-01-10", "Barefoot on the beach at sunset."),
                             ("Meera & Arjun — Jaipur", "Wedding", "Meera & Arjun", "Jaipur", PH["bride"], "2025-12-05", "Pink city, royal vibes."),
                             ("Sana & Imran — Delhi", "Engagement", "Sana & Imran", "Delhi", PH["rings"], "2025-11-20", "An intimate ring ceremony."),
                             ("Tara & Vikram — Kerala", "Pre-wedding", "Tara & Vikram", "Alleppey", PH["couple"], "2025-10-08", "Backwaters and banana leaves."),
                             ("Studio Portraits", "Portrait", "Various", "Delhi", PH["lens"], "2025-09-01", "Timeless studio portraits.")),
        "services": services(("Wedding Photography", "Camera", "Full-day candid + traditional coverage.", None, PH["ceremony"]), ("Cinematic Films", "Sparkles", "Teasers and full wedding films.", None, PH["couple"]),
                             ("Pre-wedding Shoots", "Heart", "Destination shoots anywhere in India.", None, PH["beach"])),
        "pricing_plans": plans(("Essential", "₹75,000", "/event day", ["1 lead photographer", "400 edited photos", "Online gallery"], False, "Enquire"),
                               ("Signature", "₹1,80,000", "/wedding", ["2 photographers + 1 filmmaker", "Teaser + full film", "Premium album"], True, "Enquire"),
                               ("Luxury", "₹3,50,000", "/wedding", ["Full team across 3 days", "Drone coverage", "Same-day edit"], False, "Enquire")),
        "testimonials": testi(("They captured every emotion", "Aisha Khan", "Bride, Udaipur 2026", "We cry every time we watch our film."),
                              ("Super professional", "Dev Malhotra", "Groom, Goa", "Made us feel so comfortable in front of the camera."),
                              ("Album is a masterpiece", "Mrs. Sharma", "Mother of the bride", "Worth every rupee.")),
        "stats": stats(("Weddings shot", "450+", "Heart"), ("Cities", "60", "MapPin"), ("Awards", "14", "Award"), ("Years", "9", "Camera")),
        "faqs": faq(("How far in advance should we book?", "6–9 months for peak wedding season."), ("Do you travel?", "Anywhere in India and abroad."),
                    ("When do we get our photos?", "Sneak peeks in 48 hours, full gallery in 4 weeks.")),
        "partners": partners("WedMeGood", "Vogue Weddings", "ShaadiSaga", "Canon", "Sony"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("How to plan a pre-wedding shoot", "plan-prewedding", "Lumière Team", "2026-09-25", PH["couple"], "Pick a location that means something to you.",
                        "Shoot at golden hour and bring two outfit changes.", "tips"))},
}

# ============================================================== NGO
N = dict(kids="1488521787991-ed7bbaae773c", heart="1469571486292-0ba58a3f068b", coins="1532629345422-7515f3d16bb6", vol="1559027615-cd4628902d4a",
         boxes="1593113598332-cd288d649433", smile="1509099836639-18ba1795216d")
cats, photos = gallery([("field", "In the Field")],
                       [("Smiles we serve", N["kids"], "field"), ("Volunteers", N["vol"], "field"), ("Relief drives", N["boxes"], "field"),
                        ("Together", N["heart"], "field"), ("Every rupee counts", N["coins"], "field"), ("Joy", N["smile"], "field")])
DATA["ngo"] = {
    "settings": {"site_name": "Asha Foundation", "tagline": "Every child deserves a chance",
                 "about_short": "<p>Asha Foundation works with 200 villages to give children education, nutrition and healthcare. 92% of every donation reaches the ground.</p>",
                 "phone": "+91 33 4000 7788", "email": "give@ashafoundation.org", "address": "Salt Lake Sector V, Kolkata 700091",
                 "cta_text": "Donate Now", "cta_link": "/contact", "footer_text": "Donations are tax exempt under section 80G."},
    "modules": {
        "sliders": sliders(("Give a child a future", "₹1,000 feeds a child for a month.", N["kids"]),
                           ("Be the change", "Join 3,000 volunteers across India.", N["vol"]),
                           ("Relief when it matters", "Food and medicine to flood-hit families.", N["boxes"])),
        "services": services(("Education for All", "BookOpen", "Learning centres and scholarships for 8,000 children.", "₹500 = 1 month of school", N["smile"]),
                             ("Nutrition", "Utensils", "Daily mid-day meals in 150 schools.", "₹1,000 = 30 meals", N["kids"]),
                             ("Health Camps", "HeartPulse", "Free check-ups and medicines in remote villages.", None, N["vol"]),
                             ("Disaster Relief", "Shield", "Rapid response kits during floods and cyclones.", None, N["boxes"])),
        "projects": projects(("Flood Relief Bengal 2026", "Relief", "Asha Foundation", "Sundarbans", N["boxes"], "2026-08-01", "12,000 families received food and medicine kits."),
                             ("1,000 Girls to School", "Education", "Asha Foundation", "Bihar", N["smile"], "2026-04-01", "Scholarships and cycles for girl students."),
                             ("Clean Water Drive", "Health", "Asha Foundation", "Jharkhand", N["heart"], "2025-12-01", "40 villages with safe drinking water.")),
        "team_members": team(("Dr. Meenakshi Bose", "Founder", "Paediatrician turned changemaker."), ("Arindam Das", "Programs Head", "15 years in rural development."),
                             ("Sneha Ghosh", "Volunteer Lead", "Manages 3,000 volunteers.")),
        "testimonials": testi(("I can study now", "Puja, 12", "Scholarship student", "I want to become a teacher like my didi at the centre."),
                              ("Transparent and impactful", "Rajiv Sinha", "Monthly donor", "I get photo updates of exactly where my money goes."),
                              ("Volunteering changed me", "Kavya Rao", "Volunteer", "The best weekends of my life.")),
        "stats": stats(("Children helped", "85,000", "Smile"), ("Villages", "200", "Home"), ("Volunteers", "3,000", "HandHeart"), ("Meals served", "1.2Cr", "Utensils")),
        "faqs": faq(("Is my donation tax deductible?", "Yes, 50% deduction under section 80G."), ("How is money used?", "92% goes directly to programs; audited yearly."),
                    ("Can I volunteer?", "Yes! Fill the contact form and we'll call you.")),
        "partners": partners("CRY", "GiveIndia", "Tata Trusts", "Rotary Club", "UNICEF India"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("Puja's journey back to school", "puja-story", "Sneha Ghosh", "2026-10-07", N["smile"], "From working in fields to topping her class.",
                        "Your support made Puja's story possible.", "stories"))},
}

# ============================================================== INTERIOR
I = dict(living="1618221195710-dd6b41faaea6", chair="1586023492125-27b2c045efd7", living2="1616486338812-3dadae4b4ace", plants="1600210492486-724fe5c67fb0",
         bed="1615874959474-d609969a20ed", kitchen="1556909114-f6e7ad7d3136", bed2="1505693416388-ac5ce068fe85")
cats, photos = gallery([("living", "Living"), ("bedroom", "Bedrooms")],
                       [("Warm minimal living", I["living"], "living"), ("Mustard accent", I["chair"], "living"), ("Neutral lounge", I["living2"], "living"),
                        ("Boho bedroom", I["bed"], "bedroom"), ("Green corner", I["plants"], "living"), ("Classic suite", I["bed2"], "bedroom")])
DATA["interior"] = {
    "settings": {"site_name": "Studio Aangan Interiors", "tagline": "Spaces that feel like you",
                 "about_short": "<p>Studio Aangan designs warm, functional homes and offices with end-to-end execution — from concept to keys in 45 days.</p>",
                 "phone": "+91 79 4000 5566", "email": "design@studioaangan.in", "address": "Sindhu Bhavan Road, Ahmedabad 380059",
                 "cta_text": "Book a Design Consultation", "cta_link": "/contact", "footer_text": "10-year warranty on all modular work."},
    "modules": {
        "sliders": sliders(("Design that feels like home", "Warm, minimal, timeless interiors.", I["living"]),
                           ("Bedrooms you'll never want to leave", "Calm palettes and soft textures.", I["bed"]),
                           ("Kitchens made for living", "Modular kitchens with smart storage.", I["kitchen"])),
        "projects": projects(("The Shah Residence", "Living Room", "Shah family", "Ahmedabad", I["living"], "2026-08-01", "A warm minimal 4 BHK with oak and linen."),
                             ("Mustard Loft", "Apartment", "Ritika M.", "Mumbai", I["chair"], "2026-06-15", "Bold accents in a compact city loft."),
                             ("Serene Suite", "Bedroom", "The Kapoors", "Delhi", I["bed2"], "2026-04-10", "Hotel-style master bedroom."),
                             ("Green Haven", "Living Room", "Dr. Patel", "Surat", I["plants"], "2026-02-20", "Biophilic design with 40 plants."),
                             ("Boho Retreat", "Bedroom", "Sana K.", "Pune", I["bed"], "2025-12-01", "Rattan, macramé and morning light."),
                             ("Family Kitchen", "Kitchen", "Mehta family", "Vadodara", I["kitchen"], "2025-10-01", "Modular kitchen with breakfast counter.")),
        "services": services(("Full Home Interiors", "Home", "Concept to execution with one team.", "From ₹1,800/sqft", I["living2"]),
                             ("Modular Kitchens", "Utensils", "Factory-finished, installed in 10 days.", "From ₹2.5L", I["kitchen"]),
                             ("Bedroom Design", "Bed", "Wardrobes, beds and lighting.", None, I["bed"]), ("Space Planning", "Ruler", "Smart layouts for small homes.", None, I["plants"])),
        "team_members": team(("Nidhi Shah", "Principal Designer", "Architect, 14 years."), ("Kunal Patel", "Project Manager", "On-time, every time."),
                             ("Riya Desai", "3D Visualiser", "Photo-real renders before we build.")),
        "testimonials": testi(("Our dream home", "Mr. & Mrs. Shah", "4 BHK, Ahmedabad", "Every corner feels thoughtful. Delivered in 42 days!"),
                              ("Loved the 3D previews", "Ritika M.", "Mumbai loft", "What we saw in 3D is exactly what we got."),
                              ("Stress-free process", "Dr. Patel", "Surat", "One team handled everything.")),
        "stats": stats(("Homes designed", "600+", "Home"), ("Days avg. delivery", "45", "Clock"), ("Design awards", "9", "Award"), ("Warranty", "10 yrs", "Shield")),
        "faqs": faq(("What is the cost of full-home interiors?", "Typically ₹1,800–3,500 per sqft depending on finishes."), ("Do you show 3D designs?", "Yes, photo-real 3D before execution."),
                    ("Do you work outside Gujarat?", "Yes — Mumbai, Pune and Delhi NCR.")),
        "partners": partners("Hettich", "Asian Paints", "Jaquar", "Greenply", "Hafele"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("7 ways to make a small home feel bigger", "small-home-bigger", "Nidhi Shah", "2026-09-18", I["living2"], "Light colours and mirrors are just the start.",
                        "Use floating furniture and keep one consistent floor material.", "tips"))},
}

# ============================================================== CONSTRUCTION
K = dict(site="1504307651254-35680f356dfd", workers="1541888946425-d81bb19240f5", blueprint="1503387762-592deb58ef4e", building="1487958449943-2429e8be8625",
         city="1486325212027-8081e485255e", towers="1486406146926-c627a92ad1ab")
cats, photos = gallery([("sites", "Sites")],
                       [("Ongoing site", K["site"], "sites"), ("Ground work", K["workers"], "sites"), ("Planning", K["blueprint"], "sites"),
                        ("Completed tower", K["building"], "sites"), ("City projects", K["city"], "sites"), ("Commercial", K["towers"], "sites")])
DATA["construction"] = {
    "settings": {"site_name": "Bharat Buildcon", "tagline": "Building trust since 1998",
                 "about_short": "<p>Bharat Buildcon is a turnkey construction company delivering residential, commercial and infrastructure projects on time and on budget.</p>",
                 "phone": "+91 120 456 7890", "email": "projects@bharatbuildcon.in", "address": "Sector 62, Noida, Uttar Pradesh 201309",
                 "cta_text": "Request a Quote", "cta_link": "/contact", "footer_text": "ISO 9001 · Safety first, always."},
    "modules": {
        "sliders": sliders(("We build what matters", "25 years · 300+ projects · zero compromises.", K["building"]),
                           ("Safety on every site", "Certified engineers and trained crews.", K["site"]),
                           ("From blueprint to skyline", "Design-build services under one roof.", K["blueprint"])),
        "projects": projects(("Orchid Heights", "Residential", "Orchid Developers", "Noida", K["building"], "2026-05-01", "Twin 22-storey towers with 340 apartments."),
                             ("TechPark Phase II", "Commercial", "InfoSpace Ltd", "Gurugram", K["towers"], "2025-11-15", "6 lakh sqft Grade-A office space."),
                             ("Metro Depot Civil Works", "Infrastructure", "DMRC", "Delhi", K["workers"], "2025-08-01", "Civil works for a 40-acre metro depot."),
                             ("City Mall Expansion", "Commercial", "City Malls", "Ghaziabad", K["city"], "2025-03-10", "Two new floors without closing the mall.")),
        "services": services(("Residential Construction", "Home", "Villas, apartments and townships.", None, K["building"]),
                             ("Commercial Projects", "Building2", "Offices, malls and hospitals.", None, K["towers"]),
                             ("Civil & Infrastructure", "HardHat", "Roads, bridges and metro works.", None, K["workers"]),
                             ("Design & Build", "Ruler", "Architecture to handover, one contract.", None, K["blueprint"])),
        "team_members": team(("Ramesh Gupta", "Managing Director", "Civil engineer, 30 years."), ("Anjali Saxena", "Chief Architect", "Award-winning designer."),
                             ("Harpreet Singh", "Head of Safety", "Zero-accident record for 5 years."), ("Mohit Tyagi", "Project Director", "Delivered 80+ projects.")),
        "testimonials": testi(("Delivered 2 months early", "Vivek Jain", "MD, Orchid Developers", "Exceptional quality and planning."),
                              ("Safety culture is top class", "Er. S. Rao", "DMRC", "A contractor we trust with critical works."),
                              ("Transparent costing", "Neeraj Arora", "City Malls", "No surprises, no overruns.")),
        "stats": stats(("Projects", "300+", "Building2"), ("Years", "25", "Award"), ("Sq ft built", "1.2Cr", "Ruler"), ("Engineers", "150", "HardHat")),
        "faqs": faq(("Do you handle approvals?", "Yes, we manage all municipal and environmental approvals."), ("What areas do you serve?", "Delhi NCR, UP, Haryana and Rajasthan."),
                    ("Do you do renovations?", "Yes, for commercial buildings above 20,000 sqft.")),
        "partners": partners("UltraTech", "Tata Steel", "L&T", "ACC", "JSW"),
        "gallery_categories": cats, "image_gallery": photos,
        "blogs": blogs(("How we keep projects on schedule", "on-schedule", "Mohit Tyagi", "2026-09-12", K["blueprint"], "Daily planning meetings and BIM models.",
                        "We track every activity against a digital twin of the project.", "process"))},
}

# ============================================================== PORTFOLIO
F = dict(code="1498050108023-c5249f4df085", code2="1517694712202-14dd9538aa97", desk="1499951360447-b19be8fe80f5", tablet="1558655146-9f40138edfeb",
         swatch="1561070791-2526d30994b5", dash="1551288049-bebda4e38f71")
DATA["portfolio"] = {
    "settings": {"site_name": "Aarav Kapoor", "tagline": "Product designer & front-end developer",
                 "about_short": "<p>I'm Aarav — I design and build clean, accessible digital products. 8 years of turning ideas into interfaces people love.</p>",
                 "phone": "+91 98990 11223", "email": "hello@aaravkapoor.dev", "address": "Bengaluru, India · Available worldwide",
                 "cta_text": "Hire Me", "cta_link": "/contact", "footer_text": "Let's build something great together."},
    "modules": {
        "sliders": sliders(("Hi, I'm Aarav.", "I design & build digital products people love.", F["desk"])),
        "projects": projects(("FinTrack Dashboard", "UI/UX", "FinTrack", "Remote", F["dash"], "2026-07-01", "A personal finance dashboard used by 200K people."),
                             ("Swatch Design System", "Design System", "Lumos", "Remote", F["swatch"], "2026-04-10", "120 components shared across 6 products."),
                             ("CodeCamp Website", "Web Development", "CodeCamp", "Bengaluru", F["code"], "2026-01-15", "Next.js site with 98 Lighthouse score."),
                             ("Sketchbook App", "Mobile App", "Personal", "—", F["tablet"], "2025-10-01", "A drawing app for iPad."),
                             ("DevNotes", "Open Source", "GitHub", "—", F["code2"], "2025-06-01", "Markdown notes app with 4K stars.")),
        "services": services(("Product Design", "PenTool", "Research, wireframes and polished UI.", None, None), ("Front-end Development", "Code", "React, Next.js and TypeScript.", None, None),
                             ("Design Systems", "Palette", "Scalable, documented component libraries.", None, None)),
        "testimonials": testi(("A rare designer-developer", "Priya Menon", "Founder, FinTrack", "Aarav shipped our dashboard in 6 weeks. Beautiful work."),
                              ("Detail-obsessed", "Tom Becker", "Head of Design, Lumos", "Our design system finally makes sense.")),
        "stats": stats(("Projects", "60+", "Briefcase"), ("Years", "8", "Clock"), ("Happy clients", "35", "Smile"), ("GitHub stars", "6K", "Star")),
        "faqs": faq(("Are you available for freelance?", "Yes, from December 2026."), ("Do you work with startups?", "Startups are my favourite clients.")),
        "partners": partners("Razorpay", "Lumos", "FinTrack", "CodeCamp"),
        "blogs": blogs(("Designing for accessibility first", "accessibility-first", "Aarav", "2026-08-05", F["tablet"], "Accessible design is just good design.",
                        "Start with contrast, focus states and real content.", "design"))},
}

# ============================================================== NEWS
NW = dict(space="1446776811953-b23d57bd21aa", earth="1451187580459-43490279c0fa", track="1461896836934-ffe607ba8211", concert="1470229722913-7c0e2dbbafd3",
          forest="1473448912268-2022ce9509d8", city="1477959858617-67f85cf4f1df", cinema="1489599849927-2ee91cede3ba", reader="1495020689067-958852a7765e",
          network="1495592822108-9e6261896da8", papers="1504711434969-e33886168f5c", phone="1512941937669-90a1b58e7e9c", cycling="1517649763962-0c623066013b",
          chip="1518770660439-4636190af475", globe="1521295121783-8a321d551ad2", taj="1524492412937-b28074a5d7da", dash="1526628953301-3e589a6a8b74",
          house="1529107386315-e1a2ed48a620", flag="1532375810709-75b1da00537c", cricket="1540747913346-19e32dc3e97e", doctor="1576091160399-112ba8d25d1d",
          typewriter="1585829365295-ab7cd400c167", stocks="1590283603385-17ffb3a7f29f", candles="1611974789855-9c2a0a7236a3")


def news_posts(*items):
    """(title, slug, category, reporter, date, img, caption, location, summary, paragraphs, tags, flags) — flags: B=breaking F=top story T=trending"""
    out = []
    for t, slug, cat, rep, d, img, cap, loc, sm, paras, tags, flags in items:
        body = f"<p><strong>{loc}:</strong> {sm}</p>" + "".join(f"<p>{x}</p>" for x in paras)
        out.append({"title": t, "slug": slug, "category_id": "@" + cat, "reporter_id": "@" + rep, "published_date": d, "cover_image": u(img),
                    "image_caption": cap, "location": loc, "summary": sm, "body": body, "tags": tags,
                    "is_breaking": "B" in flags, "is_featured": "F" in flags, "is_trending": "T" in flags})
    return out


reporters = [{"_key": k, **r} for k, r in zip(["anjali", "rahul", "meera", "kabir", "farah"], team(
    ("Anjali Verma", "Senior Political Correspondent", "Covers Parliament and national politics for 12 years."),
    ("Rahul Khanna", "Business Editor", "Former equity analyst; writes on markets, startups and the economy."),
    ("Meera Iyer", "Sports Reporter", "Has reported from three Cricket World Cups and two Olympics."),
    ("Kabir Sethi", "Technology Editor", "Tracks gadgets, AI and India's digital economy."),
    ("Farah Qureshi", "Entertainment & Lifestyle Writer", "Reviews films, music and everything pop culture.")))]
cats, photos = gallery([("week", "Pictures of the Week"), ("sport", "Sports in Frames"), ("culture", "Culture & Festivals")],
                       [("Monuments at dawn", NW["taj"], "week"), ("Tricolour over the capital", NW["flag"], "week"), ("City lights from space", NW["earth"], "week"),
                        ("Night match under lights", NW["cricket"], "sport"), ("Sprint start", NW["track"], "sport"), ("Peloton in the hills", NW["cycling"], "sport"),
                        ("Festival concert crowd", NW["concert"], "culture"), ("Back at the cinema", NW["cinema"], "culture")])
for c, img in zip(cats, [NW["taj"], NW["cricket"], NW["concert"]]):
    c["cover_image"] = u(img)
NP = ["The development was confirmed by officials on Thursday evening, and a detailed notification is expected within the week.",
      "Experts say the move could have a far-reaching impact over the next few years, though several questions about implementation remain open.",
      "Stakeholders have welcomed the step but asked for clear timelines and regular public updates on progress."]
DATA["news"] = {
    "settings": {"site_name": "The Daily Pulse", "tagline": "Truth first. Every hour.",
                 "about_short": "<p>The Daily Pulse is an independent digital newsroom bringing you fast, fair and fact-checked news from India and the world — 24×7.</p>",
                 "phone": "+91 11 4567 8900", "email": "newsdesk@dailypulse.in", "address": "Pulse House, Barakhamba Road, New Delhi 110001",
                 "cta_text": "Subscribe", "cta_link": "/contact", "facebook": "https://facebook.com", "youtube": "https://youtube.com", "twitter": "https://x.com",
                 "footer_text": "Got a story? Write to newsdesk@dailypulse.in · All demo stories are fictional."},
    "modules": {
        "sliders": sliders(("News that matters, as it happens", "Fast, fair and fact-checked — from India and the world.", NW["papers"]),
                           ("Read the day's biggest stories", "Politics, business, sports, tech and more.", NW["reader"])),
        "news_categories": [
            {"_key": "india", "title": "India", "slug": "india", "color": "orange", "show_on_home": True, "description": "National news, politics and governance."},
            {"_key": "world", "title": "World", "slug": "world", "color": "blue", "show_on_home": True, "description": "International affairs and global events."},
            {"_key": "business", "title": "Business", "slug": "business", "color": "green", "show_on_home": True, "description": "Markets, economy, startups and companies."},
            {"_key": "sports", "title": "Sports", "slug": "sports", "color": "red", "show_on_home": True, "description": "Cricket, football, Olympics and more."},
            {"_key": "tech", "title": "Technology", "slug": "technology", "color": "violet", "show_on_home": True, "description": "Gadgets, AI, apps and the internet."},
            {"_key": "ent", "title": "Entertainment", "slug": "entertainment", "color": "pink", "show_on_home": True, "description": "Films, music, OTT and celebrities."},
            {"_key": "health", "title": "Health", "slug": "health", "color": "teal", "show_on_home": False, "description": "Wellness, medicine and fitness."},
            {"_key": "env", "title": "Environment", "slug": "environment", "color": "amber", "show_on_home": False, "description": "Climate, wildlife and sustainability."}],
        "team_members": reporters,
        "news_posts": news_posts(
            ("Parliament clears landmark data protection rules after marathon debate", "parliament-clears-data-protection-rules", "india", "anjali", "2026-10-30",
             NW["house"], "Members during the late-night session. (Representational)", "New Delhi",
             "Both Houses passed the rules late on Wednesday, giving citizens new rights over how their personal data is collected and used.",
             ["Under the new rules, companies must take clear consent before collecting personal data and delete it once the purpose is served.", *NP],
             "parliament, privacy, data", "BFT"),
            ("Sensex jumps 900 points as banks and IT stocks rally", "sensex-jumps-900-points", "business", "rahul", "2026-10-30",
             NW["stocks"], "Markets closed at a record high on Thursday.", "Mumbai",
             "Benchmark indices closed at record highs on strong buying in banking and IT shares and steady foreign inflows.",
             ["Analysts credited the rally to better-than-expected quarterly results and easing global bond yields.", *NP[1:]], "sensex, markets, stocks", "BFT"),
            ("India seal series with thrilling last-over win", "india-seal-series-last-over-win", "sports", "meera", "2026-10-29",
             NW["cricket"], "Fans celebrate under the floodlights.", "Ahmedabad",
             "Needing 11 off the final over, the lower order held its nerve to clinch the series 3-1 in front of a packed stadium.",
             ["The captain called it 'one of the best team efforts' of the season and praised the young bowlers.", *NP[1:]], "cricket, team india", "FT"),
            ("Made-in-India AI chip enters mass production", "made-in-india-ai-chip", "tech", "kabir", "2026-10-29",
             NW["chip"], "The new chip is designed for phones and laptops.", "Bengaluru",
             "A Bengaluru start-up has begun mass production of an energy-efficient AI chip designed entirely in India.",
             ["The company says the chip uses 40% less power than comparable imports and will ship in devices next year.", *NP[1:]], "ai, semiconductors, startups", "FT"),
            ("Global leaders agree on new climate finance target", "global-climate-finance-target", "world", "anjali", "2026-10-28",
             NW["globe"], "Delegates at the summit venue.", "Geneva",
             "Nearly 190 countries agreed on a fresh climate-finance goal after two weeks of tough negotiations.",
             ["Developing nations called it a step forward but said the money must reach communities quickly.", *NP[1:]], "climate, summit", "F"),
            ("IMD forecasts a pleasant winter for North India", "imd-forecasts-pleasant-winter", "india", "anjali", "2026-10-28",
             NW["city"], "A clear evening skyline after the rains.", "New Delhi",
             "The weather office expects near-normal winter temperatures and fewer cold-wave days this year.", NP, "weather, imd", "B"),
            ("Blockbuster sequel crosses ₹500 crore in two weeks", "blockbuster-sequel-500-crore", "ent", "farah", "2026-10-28",
             NW["cinema"], "Packed theatres across the country.", "Mumbai",
             "The much-awaited sequel has become the fastest film of the year to cross the ₹500 crore mark worldwide.",
             ["Trade analysts expect the run to continue through the festive weekend.", *NP[1:]], "box office, films", "T"),
            ("Retail investors cross 15 crore demat accounts", "retail-investors-15-crore-demat", "business", "rahul", "2026-10-27",
             NW["candles"], "First-time investors are driving the surge.", "Mumbai",
             "Demat accounts have doubled in three years as more young Indians start investing through mobile apps.", NP, "investing, demat", ""),
            ("Smartphone shipments hit record high this festive season", "smartphone-shipments-record", "tech", "kabir", "2026-10-27",
             NW["phone"], "5G phones made up most of the sales.", "New Delhi",
             "Festive sales pushed quarterly smartphone shipments to an all-time high, led by budget 5G models.", NP, "smartphones, 5g", "T"),
            ("Young sprinter breaks 20-year-old national record", "sprinter-breaks-national-record", "sports", "meera", "2026-10-26",
             NW["track"], "The record-breaking run in the 100m final.", "Bhubaneswar",
             "The 19-year-old clocked 10.09 seconds to rewrite the oldest record in Indian athletics.", NP, "athletics, records", "T"),
            ("Study links 30 minutes of daily walking to better heart health", "daily-walking-heart-health", "health", "farah", "2026-10-26",
             NW["doctor"], "Doctors recommend regular moderate exercise.", "Chennai",
             "A five-year study of 20,000 adults found that a brisk daily walk cut heart-disease risk by almost a third.", NP, "health, fitness, heart", ""),
            ("Tiger count rises in central India reserves", "tiger-count-rises", "env", "kabir", "2026-10-25",
             NW["forest"], "Dense forests of a central India tiger reserve.", "Bhopal",
             "The latest survey shows a steady rise in tiger numbers, credited to better protection and wildlife corridors.", NP, "wildlife, tigers, environment", ""),
            ("Satellite network to bring internet to 10,000 remote villages", "satellite-internet-remote-villages", "tech", "kabir", "2026-10-25",
             NW["space"], "The constellation will cover hilly and island regions.", "Sriharikota",
             "A new low-earth-orbit satellite network will connect remote villages in hilly and island regions by next year.", NP, "space, internet, satellites", ""),
            ("Indian cycling team wins historic Asian gold", "cycling-team-asian-gold", "sports", "meera", "2026-10-24",
             NW["cycling"], "The team on the final climb.", "Jakarta",
             "India won its first-ever Asian gold in team road cycling after a strong finish on the final climb.", NP, "cycling, asian games", ""),
            ("Music festival season opens with record crowds", "music-festival-season-opens", "ent", "farah", "2026-10-24",
             NW["concert"], "Fans at the opening night.", "Goa",
             "The country's biggest music festival opened to a sold-out crowd, with over 80 artists across five stages.", NP, "music, festivals", ""),
            ("New light-and-sound show unveiled at historic monument", "heritage-light-show", "world", "anjali", "2026-10-23",
             NW["taj"], "Visitors at sunrise.", "Agra",
             "A new evening light-and-sound show will tell the monument's story using projection mapping.", NP, "tourism, heritage", ""),
            ("Fintech start-ups raise record funding in Q3", "fintech-record-funding-q3", "business", "rahul", "2026-10-22",
             NW["dash"], "Payments and lending apps led the funding.", "Bengaluru",
             "Indian fintech companies raised more money in the July–September quarter than in any quarter since 2021.", NP, "fintech, funding, startups", "")),
        "blogs": blogs(("Why local news still matters", "why-local-news-matters", "Editor's Desk", "2026-10-27", NW["typewriter"],
                        "In an age of endless feeds, trusted local reporting is more important than ever.",
                        "Local journalists are often the first to spot problems — from broken roads to unpaid wages — and the last to leave a story.", "opinion, journalism"),
                       ("Reading the budget like a pro", "reading-the-budget", "Rahul Khanna", "2026-10-20", NW["papers"],
                        "Five numbers to look at before you read any budget headline.",
                        "Start with the fiscal deficit, then capital expenditure, tax buoyancy, subsidies and interest payments.", "opinion, economy")),
        "sponsors": [
            {"title": "FinEdge Bank", "position": "Header", "image": u(NW["dash"]), "headline": "Zero-fee savings account — open in 5 minutes", "link_url": "https://example.com"},
            {"title": "SkyNet Fibre", "position": "Home Page", "image": u(NW["network"]), "headline": "1 Gbps fibre at ₹699/month · Free installation", "link_url": "https://example.com"},
            {"title": "Pulse Premium", "position": "Sidebar", "image": u(NW["reader"]), "headline": "Go ad-free with Pulse Premium", "link_url": "https://example.com"},
            {"title": "TravelNest", "position": "In Article", "image": u(T["beach"]), "headline": "Winter getaways from ₹9,999", "link_url": "https://example.com"}],
        "gallery_categories": cats, "image_gallery": photos,
        "testimonials": testi(("My first read every morning", "Sanjay Bhatt", "Reader since 2019", "Quick, balanced and no clickbait. The 7 AM briefing is perfect."),
                              ("Best business coverage", "Pooja Nair", "Chartered Accountant", "Rahul Khanna's market wrap explains the day in five minutes."),
                              ("Love the photo stories", "Imran Sheikh", "College student", "The weekly picture albums are beautiful.")),
        "stats": stats(("Monthly readers", "2.4M", "Users"), ("Stories a day", "150+", "Zap"), ("Reporters", "60", "PenTool"), ("Cities covered", "120", "MapPin")),
        "partners": partners("PTI", "Reuters", "IANS", "ANI", "AFP"),
        "faqs": faq(("How can I send a news tip?", "Write to newsdesk@dailypulse.in or use the contact form. We protect our sources."),
                    ("How do I advertise with you?", "Email ads@dailypulse.in for our media kit and rates."),
                    ("Do you publish corrections?", "Yes. Errors are corrected promptly and noted at the end of the story."))},
}

# ============================================================== ECOMMERCE
SH = dict(watch="1523275335684-37898b6baf30", phones="1505740420928-5e560c06d30e", shoe="1542291026-7eec264c27ff", camera="1526170375885-4d8ecf77b99f",
          shades="1572635196237-14b3f281503f", tee="1521572163474-6864f9cf17ab", smartwatch="1546868871-7041f2a55e12", skincare="1556228578-8c89e6adf883",
          bag="1584917865442-de89df76afd3", laptop="1517336714731-489689fd1ca8", mobile="1511707171634-5f897ff02aa9", mug="1514228742587-6b1558fcca3d",
          store="1441986300917-64674bd600d8", shopping="1483985988355-763728e1935b", fashion="1515886657613-9f3515b0c78f", mantee="1503342217505-b0a15ec3261c",
          woman="1434389677669-e08b4cac3105")


def product(key, title, slug, cat, price, mrp, gst, stock, img, summary, brand, featured=False, opts=(None, None), extra=()):
    images = {f"image_{i + 2}": u(x) for i, x in enumerate(extra)}
    return {"_key": key, "title": title, "slug": slug, "category_id": "@" + cat, "brand": brand, "sku": slug.upper()[:20], "price": price, "compare_price": mrp,
            "gst_rate": gst, "stock": stock, "cover_image": u(img), **images, "summary": summary,
            "description": f"<p>{summary}</p><ul><li>Premium quality, checked before dispatch</li><li>7-day easy returns</li><li>Cash on Delivery available</li></ul>",
            "option1_name": opts[0], "option2_name": opts[1], "is_featured": featured, "tags": cat}


def variants(pkey, sku, opt1, opt2=(None,), stock=15, price=None):
    rows = []
    for a in opt1:
        for b in opt2:
            rows.append({"product_id": "@" + pkey, "title": " / ".join(x for x in (a, b) if x), "option1": a, "option2": b,
                         "sku": f"{sku}-{a}{'-' + b if b else ''}".upper().replace(" ", ""), "price": price, "stock": stock})
    return rows


DATA["ecommerce"] = {
    "settings": {"site_name": "Kartly", "tagline": "Everyday style, delivered to your door",
                 "about_short": "<p>Kartly is a homegrown online store for fashion, gadgets and lifestyle products — handpicked quality, honest prices, free shipping above ₹999 and easy 7-day returns.</p>",
                 "phone": "+91 99100 55443", "email": "care@kartly.in", "address": "Plot 21, Sector 18, Gurugram, Haryana 122015",
                 "cta_text": "Shop Now", "cta_link": "/shop", "instagram": "https://instagram.com", "facebook": "https://facebook.com",
                 "footer_text": "100% secure payments · Cash on Delivery · 7-day easy returns"},
    "modules": {
        "sliders": sliders(("The Festive Edit is here", "Up to 50% off on fashion, footwear & gadgets.", SH["shopping"]),
                           ("New season, new you", "Fresh arrivals every week — free shipping above ₹999.", SH["fashion"]),
                           ("Tech that travels", "Headphones, smartwatches and more at the best prices.", SH["phones"])),
        "product_categories": [
            {"_key": "men", "title": "Men", "slug": "men", "image": u(SH["mantee"]), "show_on_home": True, "description": "T-shirts, shirts and everyday essentials."},
            {"_key": "women", "title": "Women", "slug": "women", "image": u(SH["woman"]), "show_on_home": True, "description": "Dresses, tops and handbags."},
            {"_key": "footwear", "title": "Footwear", "slug": "footwear", "image": u(SH["shoe"]), "show_on_home": True, "description": "Sneakers and running shoes."},
            {"_key": "electronics", "title": "Electronics", "slug": "electronics", "image": u(SH["phones"]), "show_on_home": True, "description": "Audio, wearables and cameras."},
            {"_key": "accessories", "title": "Accessories", "slug": "accessories", "image": u(SH["watch"]), "show_on_home": True, "description": "Watches, sunglasses and bags."},
            {"_key": "home", "title": "Home & Living", "slug": "home-living", "image": u(SH["mug"]), "show_on_home": True, "description": "Mugs, decor and more."},
            {"_key": "beauty", "title": "Beauty", "slug": "beauty", "image": u(SH["skincare"]), "show_on_home": False, "description": "Skincare and self-care."}],
        "products": [
            product("tee", "Essential Cotton Crew T-Shirt", "essential-cotton-tee", "men", 499, 899, "5", None, SH["tee"],
                    "Super-soft 180 GSM combed cotton tee with a relaxed fit. Pre-shrunk and bio-washed.", "Kartly Basics", True, ("Size", "Colour"), [SH["mantee"]]),
            product("graphic", "Urban Graphic Oversized Tee", "urban-graphic-tee", "men", 699, 1199, "5", None, SH["mantee"],
                    "Drop-shoulder oversized tee with a minimal graphic print.", "Kartly Street", False, ("Size", None)),
            product("runner", "AirStride Running Shoes", "airstride-running-shoes", "footwear", 2499, 3999, "12", None, SH["shoe"],
                    "Lightweight mesh runners with responsive cushioning for daily miles.", "Stride", True, ("UK Size", None)),
            product("phones", "Studio Wireless Headphones", "studio-wireless-headphones", "electronics", 3299, 5999, "18", 25, SH["phones"],
                    "40-hour battery, active noise cancellation and plush memory-foam ear cushions.", "SonicWave", True),
            product("smartwatch", "FitPulse Smartwatch", "fitpulse-smartwatch", "electronics", 2799, 4999, "18", 30, SH["smartwatch"],
                    "AMOLED display, SpO2 and heart-rate tracking, 7-day battery and 100+ sports modes.", "FitPulse", True),
            product("camera", "Retro Instant Camera", "retro-instant-camera", "electronics", 5499, 6999, "18", 8, SH["camera"],
                    "Print memories instantly with this classic-styled instant camera.", "SnapCo"),
            product("watch", "Heritage Analog Watch", "heritage-analog-watch", "accessories", 1899, 2999, "18", 12, SH["watch"],
                    "Minimal dial, genuine leather strap and 3 ATM water resistance.", "Tempo", True),
            product("shades", "Aviator Polarised Sunglasses", "aviator-polarised-sunglasses", "accessories", 999, 1999, "12", 40, SH["shades"],
                    "UV400 polarised lenses in a lightweight metal frame.", "Glare"),
            product("bag", "Everyday Leather Handbag", "everyday-leather-handbag", "women", 2199, 3499, "12", None, SH["bag"],
                    "Spacious vegan-leather handbag with a detachable sling strap.", "Mia", True, ("Colour", None)),
            product("laptop", "UltraBook 14 Laptop", "ultrabook-14-laptop", "electronics", 54990, 64990, "18", 5, SH["laptop"],
                    "14\" FHD display, 16 GB RAM, 512 GB SSD and an all-day battery.", "Nova"),
            product("mobile", "Nova X Smartphone (128 GB)", "nova-x-smartphone", "electronics", 18999, 21999, "18", 3, SH["mobile"],
                    "6.5\" AMOLED, 50 MP camera and 5000 mAh battery with 33W fast charging.", "Nova"),
            product("mug", "Handmade Ceramic Mug Set (2)", "ceramic-mug-set", "home", 649, 999, "12", 60, SH["mug"],
                    "Microwave-safe stoneware mugs, glazed by hand. Set of two, 350 ml each.", "Clay & Co"),
            product("skincare", "Glow Daily Skincare Kit", "glow-skincare-kit", "beauty", 1299, 1799, "18", 20, SH["skincare"],
                    "Cleanser, serum and moisturiser for a simple 3-step routine.", "Glow Lab")],
        "product_variants": (
            variants("tee", "ECT", ["S", "M", "L", "XL"], ["Black", "White"], stock=20)
            + variants("graphic", "UGT", ["M", "L", "XL"], stock=12)
            + variants("runner", "ASR", ["7", "8", "9", "10"], stock=6)
            + variants("bag", "ELH", ["Tan", "Black"], stock=10)),
        "coupons": [
            {"code": "WELCOME10", "discount_type": "Percent", "value": 10, "min_order": 499, "max_discount": 300, "per_customer_limit": 1,
             "description": "10% off on your first order (up to ₹300)"},
            {"code": "FLAT200", "discount_type": "Flat", "value": 200, "min_order": 1999, "description": "₹200 off on orders above ₹1,999"}],
        "testimonials": testi(("Super fast delivery", "Ritika Sharma", "Verified buyer", "Ordered on Monday, got it on Wednesday. Quality is great!"),
                              ("COD made it easy", "Arjun Nair", "Verified buyer", "Paid cash on delivery, no hassle. The headphones are amazing."),
                              ("Easy returns", "Sneha Patil", "Verified buyer", "Size didn't fit — return was picked up the next day.")),
        "faqs": faq(("How long does delivery take?", "Metro cities: 2-4 days. Rest of India: 4-7 working days."),
                    ("Is Cash on Delivery available?", "Yes, COD is available on most pin codes."),
                    ("What is the return policy?", "Easy 7-day returns on unused items with tags. Refunds within 5-7 days."),
                    ("Are payments secure?", "All online payments are processed by Razorpay — we never see your card details.")),
        "stats": stats(("Happy customers", "50K+", "Smile"), ("Products", "1,200+", "Package"), ("Cities delivered", "800+", "Truck"), ("Avg. rating", "4.7★", "Star")),
        "partners": partners("SonicWave", "FitPulse", "Stride", "Nova", "Glow Lab", "Tempo"),
        "blogs": blogs(("How to choose the right running shoe", "choose-running-shoe", "Kartly Team", "2026-10-12", SH["shoe"],
                        "Cushioning, fit and your running style — a quick guide.", "Start with your foot type and the surface you run on most.", "guide, footwear"))},
}


# ============================================================== COMMON: har admin menu me demo data
# Upar har type ka khaas content hai. Yahan ek jagah se wo menus bharte hain jo kisi type me khaali reh gaye
# (Menus, Pages, Popups, Videos, Live, Downloads, E-Magazine, Gallery ...) — website type ke naam / photos ke saath.
ROOT = os.path.join(os.path.dirname(__file__), "..")
FILES = os.path.join(OUT, "files")
# Blender Foundation ki open movies (Creative Commons) — YouTube par saalon se stable
YT = ["https://www.youtube.com/watch?v=aqz-KE-bpKQ", "https://www.youtube.com/watch?v=eRsGyueVLvQ",
      "https://www.youtube.com/watch?v=R6MlUcmOul8", "https://www.youtube.com/watch?v=WhWc3b3KhnY"]


def enabled_modules():
    """SiteTypeCatalog.java se type -> admin menus (backend hi source of truth)"""
    java = open(os.path.join(ROOT, "backend", "src", "main", "java", "com", "wm", "settings", "SiteTypeCatalog.java"), encoding="utf-8").read()
    common = re.findall(r'"([a-z_]+)"', re.search(r"COMMON = List\.of\(([\s\S]*?)\);", java).group(1))
    return {m.group(1): common + re.findall(r'"([a-z_]+)"', m.group(2))
            for m in re.finditer(r'add\("([a-z_]+)", "[^"]+",\s*List\.of\(([\s\S]*?)\),', java)}


def site_nav():
    """siteTypes.ts se har type ka default navbar (wahi links Menus me)"""
    ts = open(os.path.join(ROOT, "frontend", "src", "site", "siteTypes.ts"), encoding="utf-8").read()
    out = {}
    for block in re.split(r'\n  \{\n    key: ', ts)[1:]:
        key = re.match(r'"([a-z_]+)"', block).group(1)
        nav = re.search(r"nav: \[([\s\S]*?)\]", block).group(1)
        out[key] = re.findall(r'\{ title: "([^"]+)", href: "([^"]+)" \}', nav)
    return out


def pdf(path, title, lines):
    """Chhoti asli PDF (A4, ek page) — Downloads / E-Magazine demo ke liye"""
    def esc(t):
        return t.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").encode("latin-1", "replace").decode("latin-1")
    text = ["BT /F1 26 Tf 60 760 Td (" + esc(title) + ") Tj ET"]
    y = 715
    for ln in lines:
        text.append(f"BT /F1 12 Tf 60 {y} Td (" + esc(ln) + ") Tj ET")
        y -= 22
    stream = "\n".join(text).encode("latin-1")
    objs = [b"<< /Type /Catalog /Pages 2 0 R >>", b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
            b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    out, offsets = bytearray(b"%PDF-1.4\n"), []
    for i, o in enumerate(objs, 1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + o + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode() + b"".join(f"{o:010d} 00000 n \n".encode() for o in offsets)
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    with open(path, "wb") as fh:
        fh.write(out)


def photos_of(d):
    """Is type ke demo me jitni landscape photos hain (common rows unhi se)"""
    seen = []
    for rows in d["modules"].values():
        for r in rows:
            for v in r.values():
                if isinstance(v, str) and v.startswith("u:") and v not in seen:
                    seen.append(v)
    return seen


def complete(t, d, modules, nav):
    m, s = d["modules"], d["settings"]
    name, tagline = s["site_name"], s.get("tagline", "")
    img = photos_of(d)
    pic = lambda i: img[i % len(img)]
    add = {}
    if "menus" in modules and not m.get("menus"):
        links = [{"title": a, "custom_url": h} for a, h in nav]
        # "About" menu = Pages ka About Us (custom_url khaali => us menu ka page)
        add["menus"] = links[:1] + [{"_key": "about", "title": "About"}] + links[1:]
    if "pages" in modules and not m.get("pages"):
        about = s.get("about_short", f"<p>{name} — {tagline}</p>")
        add["pages"] = [
            {**page("About Us", "about-us", about + f"<h2>Our story</h2><p>{name} started with a simple idea: {tagline.lower() or 'do great work'}. "
                    "Today a passionate team carries that promise forward every day.</p><h2>What we believe</h2>"
                    "<ul><li>People first</li><li>Quality without shortcuts</li><li>Honest, transparent communication</li></ul>"),
             "menu_id": "@about", "banner_image": pic(0)},
            page("Privacy Policy", "privacy-policy", f"<p>{name} respects your privacy. We collect only the information you share with us "
                 "through our forms, use it only to respond to you, and never sell it.</p><p>Contact us anytime to view or delete your data.</p>"),
            page("Terms of Use", "terms", f"<p>By using the {name} website you agree to use it lawfully. Content is for general information "
                 "and may change without notice.</p>")]
    if "popups" in modules and not m.get("popups"):
        add["popups"] = [{"title": f"Welcome to {name}", "from_date": "2026-10-01", "to_date": "2027-03-31", "image": pic(1),
                          "description": f"<p>{tagline}. <a href=\"{s.get('cta_link', '/contact')}\">{s.get('cta_text', 'Get in touch')} →</a></p>"}]
    if "gallery_categories" in modules and not m.get("image_gallery"):
        add["gallery_categories"] = [{"_key": "moments", "title": "Moments"}]
        add["image_gallery"] = [{"title": f"{name} — {i + 1}", "image": pic(i), "category_id": "@moments"} for i in range(min(6, len(img)))]
    if "videos" in modules and not m.get("videos"):
        cats = "video_categories" in modules and not m.get("video_categories")
        if cats:
            add["video_categories"] = [{"_key": "highlights", "title": "Highlights"}, {"_key": "events", "title": "Events"}]
        titles = [f"{name} — highlights", "Behind the scenes", "A day with us", "Event recap"]
        add["videos"] = [{"title": tt, "video_url": YT[i], "video_date": f"2026-0{9 - i}-15",
                          **({"category_id": "@highlights" if i < 2 else "@events"} if cats else {})} for i, tt in enumerate(titles)]
    if "livestreams" in modules and not m.get("livestreams"):
        add["livestreams"] = [{"title": f"Live: {name} annual event", "event_url": YT[0], "event_date": "2026-12-12"},
                              {"title": "Live Q&A session", "event_url": YT[1], "event_date": "2026-11-20"}]
    if "attachments" in modules and not m.get("attachments"):
        brochure = f"{t}-brochure.pdf"
        pdf(os.path.join(FILES, brochure), name, [tagline, "", "This is a sample brochure from the demo content.",
                                                  "Replace it with your own file from Admin > Downloads.", "", s.get("phone", ""), s.get("email", "")])
        add["attachments"] = [{"title": f"{name} — Brochure", "attachment": "f:" + brochure, "description": "Everything about us in one PDF."},
                              {"title": "Enquiry Form", "attachment": "f:enquiry-form.pdf", "description": "Fill, sign and email it to us."}]
    if "enquiries" in modules and not m.get("enquiries"):
        # contact form se aaye message jaisa (admin ko Inbox kaisa dikhta hai)
        add["enquiries"] = [
            {"name": "Priya Sharma", "email": "priya.sharma@example.com", "phone": "9876500011", "subject": "Need more details",
             "message": f"Hello, I found {name} online. Could you please share more details and the best time to call?", "page": "/contact", "status": "New"},
            {"name": "Rahul Mehta", "email": "rahul.m@example.com", "phone": "9876500022", "subject": "Thank you",
             "message": "Thanks for the quick reply yesterday — all my questions are answered.", "page": "/", "status": "Replied"}]
    if "subscribers" in modules and not m.get("subscribers"):
        add["subscribers"] = [{"email": e, "source": "Footer"} for e in ("neha.k@example.com", "arjun.v@example.com", "sana.q@example.com")]
    if "magazines" in modules and not m.get("magazines"):
        mag = f"{t}-magazine.pdf"
        pdf(os.path.join(FILES, mag), f"{name} Magazine", ["Sample edition from the demo content.", "Upload your own PDF from Admin."])
        news = t == "news"
        add["magazine_categories"] = [{"_key": "a", "title": "Daily Edition" if news else "Annual Magazine"},
                                      {"_key": "b", "title": "Weekend Edition" if news else "Newsletter"}]
        add["magazines"] = [{"title": f"{'E-Paper' if news else 'Magazine'} — {mo}", "category_id": "@a" if i < 2 else "@b", "year": 2026, "month": n,
                             "page_no": 1, "cover_image": pic(i + 2), "file": "f:" + mag} for i, (mo, n) in enumerate([("October", 10), ("September", 9), ("August", 8)])]
        add["magazine_thumbnails"] = [{"title": f"Page {i + 1}", "year": 2026, "month": 10, "thumbnail": pic(i + 3)} for i in range(4)]
    # refs ke liye order: menus -> pages -> baaki (categories apni rows se pehle)
    d["modules"] = {k: v for k, v in [("menus", add.pop("menus", m.get("menus"))), ("pages", add.pop("pages", m.get("pages")))] if v}
    d["modules"].update({k: v for k, v in m.items() if k not in ("menus", "pages")})
    for k in ["gallery_categories", "video_categories", "magazine_categories"]:
        if k in add:
            d["modules"][k] = add.pop(k)
    d["modules"].update(add)


os.makedirs(FILES, exist_ok=True)
pdf(os.path.join(FILES, "enquiry-form.pdf"), "Enquiry Form", ["Name: ______________________________", "Phone: ______________________________",
                                                                "Email: ______________________________", "Message:", "", "", "Signature: __________   Date: ________"])
MODULES, NAV = enabled_modules(), site_nav()
for k, v in DATA.items():
    complete(k, v, MODULES[k], NAV[k])

for k, v in DATA.items():
    v["type"] = k

os.makedirs(OUT, exist_ok=True)
for k, v in DATA.items():
    with open(os.path.join(OUT, k + ".json"), "w", encoding="utf-8") as fh:
        json.dump(v, fh, ensure_ascii=False, indent=1)
print("wrote", len(DATA), "demo files")
