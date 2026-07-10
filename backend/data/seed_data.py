"""
Seed script — populates the DB with sample items and synthetic ratings.
Run directly:  python data/seed_data.py
Or called from main.py lifespan.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.item import Item
from app.models.rating import Rating
import random

random.seed(42)

# ─── Dataset ─────────────────────────────────────────────────────────────────

MOVIES = [
    {"title":"Inception","genres":["Sci-Fi","Thriller","Action"],"description":"A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.","metadata_json":{"director":"Christopher Nolan","cast":["Leonardo DiCaprio","Joseph Gordon-Levitt","Ellen Page"],"mood":["mind-bending","suspenseful"]},"release_year":2010,"duration":"2h 28m","avg_rating":4.8,"total_ratings":1200,"poster_url":"https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"},
    {"title":"The Dark Knight","genres":["Action","Crime","Drama"],"description":"Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations.","metadata_json":{"director":"Christopher Nolan","cast":["Christian Bale","Heath Ledger","Aaron Eckhart"],"mood":["dark","intense"]},"release_year":2008,"duration":"2h 32m","avg_rating":4.9,"total_ratings":1500,"poster_url":"https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"},
    {"title":"Interstellar","genres":["Sci-Fi","Adventure","Drama"],"description":"A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival as Earth faces an extinction-level drought.","metadata_json":{"director":"Christopher Nolan","cast":["Matthew McConaughey","Anne Hathaway","Jessica Chastain"],"mood":["emotional","epic","sci-fi"]},"release_year":2014,"duration":"2h 49m","avg_rating":4.7,"total_ratings":1100,"poster_url":"https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"},
    {"title":"The Shawshank Redemption","genres":["Drama"],"description":"Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.","metadata_json":{"director":"Frank Darabont","cast":["Tim Robbins","Morgan Freeman"],"mood":["inspiring","emotional"]},"release_year":1994,"duration":"2h 22m","avg_rating":4.9,"total_ratings":980,"poster_url":"https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"},
    {"title":"Pulp Fiction","genres":["Crime","Drama","Thriller"],"description":"The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.","metadata_json":{"director":"Quentin Tarantino","cast":["John Travolta","Samuel L. Jackson","Uma Thurman"],"mood":["stylish","dark"]},"release_year":1994,"duration":"2h 34m","avg_rating":4.8,"total_ratings":950,"poster_url":"https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg"},
    {"title":"The Matrix","genres":["Action","Sci-Fi"],"description":"A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.","metadata_json":{"director":"Wachowski Sisters","cast":["Keanu Reeves","Laurence Fishburne","Carrie-Anne Moss"],"mood":["mind-bending","action","cyber"]},"release_year":1999,"duration":"2h 16m","avg_rating":4.7,"total_ratings":1050,"poster_url":"https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg"},
    {"title":"Fight Club","genres":["Drama","Thriller"],"description":"An insomniac office worker and a devil-may-care soap salesman form an underground fight club that evolves into an anarchist organization.","metadata_json":{"director":"David Fincher","cast":["Brad Pitt","Edward Norton","Helena Bonham Carter"],"mood":["dark","twisted"]},"release_year":1999,"duration":"2h 19m","avg_rating":4.7,"total_ratings":890,"poster_url":"https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"},
    {"title":"Forrest Gump","genres":["Drama","Romance","Comedy"],"description":"The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with an IQ of 75.","metadata_json":{"director":"Robert Zemeckis","cast":["Tom Hanks","Robin Wright","Gary Sinise"],"mood":["emotional","inspiring","heartwarming"]},"release_year":1994,"duration":"2h 22m","avg_rating":4.8,"total_ratings":1020,"poster_url":"https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg"},
    {"title":"Avengers: Endgame","genres":["Action","Adventure","Sci-Fi"],"description":"After the devastating events of Infinity War, the universe is in ruins. The Avengers assemble once more to reverse Thanos' actions and restore balance to the universe.","metadata_json":{"director":"Russo Brothers","cast":["Robert Downey Jr.","Chris Evans","Mark Ruffalo"],"mood":["epic","emotional","action"]},"release_year":2019,"duration":"3h 1m","avg_rating":4.6,"total_ratings":1300,"poster_url":"https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg"},
    {"title":"Parasite","genres":["Drama","Thriller","Comedy"],"description":"Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.","metadata_json":{"director":"Bong Joon-ho","cast":["Song Kang-ho","Lee Sun-kyun","Cho Yeo-jeong"],"mood":["dark","suspenseful","satirical"]},"release_year":2019,"duration":"2h 12m","avg_rating":4.8,"total_ratings":820,"poster_url":"https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg"},
    {"title":"Dune","genres":["Sci-Fi","Adventure","Drama"],"description":"Paul Atreides, a brilliant and gifted young man born into a great destiny, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.","metadata_json":{"director":"Denis Villeneuve","cast":["Timothée Chalamet","Zendaya","Oscar Isaac"],"mood":["epic","sci-fi","adventure"]},"release_year":2021,"duration":"2h 35m","avg_rating":4.6,"total_ratings":720,"poster_url":"https://image.tmdb.org/t/p/w500/d5NXSklpcvwE3HP2SmWeqjfgiOd.jpg"},
    {"title":"Everything Everywhere All at Once","genres":["Action","Comedy","Sci-Fi"],"description":"An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.","metadata_json":{"director":"Daniel Scheinert & Daniel Kwan","cast":["Michelle Yeoh","Ke Huy Quan","Jamie Lee Curtis"],"mood":["chaotic","emotional","funny","mind-bending"]},"release_year":2022,"duration":"2h 19m","avg_rating":4.8,"total_ratings":650,"poster_url":"https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg"},
    {"title":"Spider-Man: No Way Home","genres":["Action","Adventure","Fantasy"],"description":"With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.","metadata_json":{"director":"Jon Watts","cast":["Tom Holland","Zendaya","Benedict Cumberbatch"],"mood":["nostalgic","action","emotional"]},"release_year":2021,"duration":"2h 28m","avg_rating":4.5,"total_ratings":1100,"poster_url":"https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg"},
    {"title":"Get Out","genres":["Horror","Mystery","Thriller"],"description":"A young African-American visits his white girlfriend's parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.","metadata_json":{"director":"Jordan Peele","cast":["Daniel Kaluuya","Allison Williams","Bradley Whitford"],"mood":["scary","psychological","disturbing"]},"release_year":2017,"duration":"1h 44m","avg_rating":4.6,"total_ratings":670,"poster_url":"https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg"},
    {"title":"La La Land","genres":["Drama","Musical","Romance"],"description":"While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.","metadata_json":{"director":"Damien Chazelle","cast":["Ryan Gosling","Emma Stone"],"mood":["romantic","musical","bittersweet"]},"release_year":2016,"duration":"2h 8m","avg_rating":4.5,"total_ratings":780,"poster_url":"https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg"},
    {"title":"Mad Max: Fury Road","genres":["Action","Adventure","Sci-Fi"],"description":"In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.","metadata_json":{"director":"George Miller","cast":["Tom Hardy","Charlize Theron"],"mood":["intense","action","adrenaline"]},"release_year":2015,"duration":"2h","avg_rating":4.5,"total_ratings":720,"poster_url":"https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg"},
    {"title":"The Godfather","genres":["Crime","Drama"],"description":"The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.","metadata_json":{"director":"Francis Ford Coppola","cast":["Marlon Brando","Al Pacino","James Caan"],"mood":["dark","powerful","classic"]},"release_year":1972,"duration":"2h 55m","avg_rating":4.9,"total_ratings":1400,"poster_url":"https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLeMLoGFgGC.jpg"},
    {"title":"Goodfellas","genres":["Crime","Drama","Biography"],"description":"The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners Jimmy Conway and Tommy DeVito.","metadata_json":{"director":"Martin Scorsese","cast":["Ray Liotta","Robert De Niro","Joe Pesci"],"mood":["dark","stylish","intense"]},"release_year":1990,"duration":"2h 26m","avg_rating":4.8,"total_ratings":870,"poster_url":"https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg"},
    {"title":"Schindler's List","genres":["Biography","Drama","History"],"description":"In German-occupied Poland during World War II, Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.","metadata_json":{"director":"Steven Spielberg","cast":["Liam Neeson","Ralph Fiennes","Ben Kingsley"],"mood":["devastating","important","emotional"]},"release_year":1993,"duration":"3h 15m","avg_rating":4.9,"total_ratings":920,"poster_url":"https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg"},
    {"title":"The Silence of the Lambs","genres":["Crime","Drama","Thriller"],"description":"A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer.","metadata_json":{"director":"Jonathan Demme","cast":["Jodie Foster","Anthony Hopkins"],"mood":["tense","psychological","dark"]},"release_year":1991,"duration":"1h 58m","avg_rating":4.7,"total_ratings":820,"poster_url":"https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg"},
]

BOOKS = [
    {"title":"Dune","genres":["Sci-Fi","Adventure"],"description":"Set in the distant future amidst a feudal interstellar society, Paul Atreides's family accepts stewardship of the desert planet Arrakis, the only source of the galaxy's most valuable substance.","metadata_json":{"author":"Frank Herbert","pages":412,"mood":["epic","world-building"]},"release_year":1965,"duration":"412 pages","avg_rating":4.8,"total_ratings":860,"poster_url":"https://covers.openlibrary.org/b/id/8231856-L.jpg"},
    {"title":"1984","genres":["Dystopia","Sci-Fi","Political"],"description":"Winston Smith lives in a totalitarian society where Big Brother controls every aspect of life. His secret rebellion against the Party leads to tragic consequences.","metadata_json":{"author":"George Orwell","pages":328,"mood":["dark","political","thought-provoking"]},"release_year":1949,"duration":"328 pages","avg_rating":4.7,"total_ratings":1100,"poster_url":"https://covers.openlibrary.org/b/id/8575708-L.jpg"},
    {"title":"Harry Potter and the Philosopher's Stone","genres":["Fantasy","Adventure","Young Adult"],"description":"Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive.","metadata_json":{"author":"J.K. Rowling","pages":223,"mood":["magical","adventurous","fun"]},"release_year":1997,"duration":"223 pages","avg_rating":4.8,"total_ratings":1400,"poster_url":"https://covers.openlibrary.org/b/id/8228691-L.jpg"},
    {"title":"The Lord of the Rings","genres":["Fantasy","Adventure","Epic"],"description":"One Ring to rule them all. The dark lord Sauron desires it. Frodo Baggins must destroy it. The fate of the world hangs in the balance.","metadata_json":{"author":"J.R.R. Tolkien","pages":1178,"mood":["epic","adventurous","classic"]},"release_year":1954,"duration":"1178 pages","avg_rating":4.9,"total_ratings":1200,"poster_url":"https://covers.openlibrary.org/b/id/9255566-L.jpg"},
    {"title":"Atomic Habits","genres":["Self-Help","Productivity","Psychology"],"description":"An easy and proven way to build good habits and break bad ones. James Clear draws on the most proven ideas from biology, psychology, and neuroscience.","metadata_json":{"author":"James Clear","pages":320,"mood":["motivational","practical"]},"release_year":2018,"duration":"320 pages","avg_rating":4.7,"total_ratings":1050,"poster_url":"https://covers.openlibrary.org/b/id/10521270-L.jpg"},
    {"title":"Sapiens: A Brief History of Humankind","genres":["History","Science","Non-Fiction"],"description":"From examining the role played by wheat in the Agricultural Revolution to the impact of culture on genetics, Harari explores the ways in which humans have come to dominate the Earth.","metadata_json":{"author":"Yuval Noah Harari","pages":443,"mood":["thought-provoking","educational"]},"release_year":2011,"duration":"443 pages","avg_rating":4.6,"total_ratings":890,"poster_url":"https://covers.openlibrary.org/b/id/12647472-L.jpg"},
    {"title":"The Hitchhiker's Guide to the Galaxy","genres":["Sci-Fi","Comedy","Adventure"],"description":"Seconds before the Earth is demolished to make way for a hyperspace bypass, Arthur Dent is plucked off the planet by his friend Ford Prefect, a researcher for the revised edition of The Hitchhiker's Guide to the Galaxy.","metadata_json":{"author":"Douglas Adams","pages":224,"mood":["funny","absurd","clever"]},"release_year":1979,"duration":"224 pages","avg_rating":4.7,"total_ratings":780,"poster_url":"https://covers.openlibrary.org/b/id/11478218-L.jpg"},
    {"title":"Clean Code","genres":["Programming","Software Engineering","Technical"],"description":"Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. A handbook of agile software craftsmanship.","metadata_json":{"author":"Robert C. Martin","pages":431,"mood":["technical","practical","professional"]},"release_year":2008,"duration":"431 pages","avg_rating":4.5,"total_ratings":620,"poster_url":"https://covers.openlibrary.org/b/id/8774857-L.jpg"},
    {"title":"The Alchemist","genres":["Fiction","Philosophy","Adventure"],"description":"A young Andalusian shepherd in his journey to the pyramids of Egypt after having a recurring dream of finding a treasure there.","metadata_json":{"author":"Paulo Coelho","pages":197,"mood":["inspirational","philosophical","spiritual"]},"release_year":1988,"duration":"197 pages","avg_rating":4.5,"total_ratings":960,"poster_url":"https://covers.openlibrary.org/b/id/8739161-L.jpg"},
    {"title":"Deep Work","genres":["Self-Help","Productivity","Business"],"description":"Rules for focused success in a distracted world. Professional activities performed in a state of distraction-free concentration that push your cognitive capabilities to their limit.","metadata_json":{"author":"Cal Newport","pages":296,"mood":["motivational","focused","practical"]},"release_year":2016,"duration":"296 pages","avg_rating":4.6,"total_ratings":540,"poster_url":"https://covers.openlibrary.org/b/id/9264403-L.jpg"},
]

MUSIC = [
    {"title":"Bohemian Rhapsody","genres":["Rock","Classic Rock","Opera Rock"],"description":"A six-minute suite with sections in a ballad style, followed by a hard rock part, a mock operatic passage and a reflective coda.","metadata_json":{"artist":"Queen","album":"A Night at the Opera","mood":["dramatic","epic","classic"]},"release_year":1975,"duration":"5:55","avg_rating":4.9,"total_ratings":1300,"poster_url":"https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_Bohemian_Rhapsody.png"},
    {"title":"Blinding Lights","genres":["Synth-Pop","Pop","R&B"],"description":"An 80s-inspired synth-pop song about longing and need, with pulsating beats and ethereal hooks that dominated global charts.","metadata_json":{"artist":"The Weeknd","album":"After Hours","mood":["upbeat","nostalgic","driving"]},"release_year":2019,"duration":"3:20","avg_rating":4.7,"total_ratings":980,"poster_url":"https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png"},
    {"title":"Shape of You","genres":["Pop","Dancehall","Tropical Pop"],"description":"An upbeat pop song about a chance romantic encounter that takes on unexpected depth through its tropical beats and catchy hooks.","metadata_json":{"artist":"Ed Sheeran","album":"÷","mood":["fun","upbeat","romantic"]},"release_year":2017,"duration":"3:53","avg_rating":4.6,"total_ratings":1100,"poster_url":"https://upload.wikimedia.org/wikipedia/en/7/76/Shape_of_You_%28Official_Single_Cover%29_by_Ed_Sheeran.png"},
    {"title":"Hotel California","genres":["Rock","Classic Rock","Soft Rock"],"description":"A song about the dark underbelly of the American Dream told through the metaphor of a California hotel that guests can never leave.","metadata_json":{"artist":"Eagles","album":"Hotel California","mood":["mysterious","classic","dark"]},"release_year":1977,"duration":"6:30","avg_rating":4.8,"total_ratings":870,"poster_url":"https://upload.wikimedia.org/wikipedia/en/4/49/Hotelcalifornia.jpg"},
    {"title":"Lose Yourself","genres":["Hip-Hop","Rap"],"description":"Inspired by the movie 8 Mile, this song captures the story of a young rapper's one chance at success and his internal struggle.","metadata_json":{"artist":"Eminem","album":"8 Mile Soundtrack","mood":["motivational","intense","powerful"]},"release_year":2002,"duration":"5:26","avg_rating":4.8,"total_ratings":920,"poster_url":"https://upload.wikimedia.org/wikipedia/en/3/35/Eminem_-_Lose_Yourself.jpg"},
    {"title":"Rolling in the Deep","genres":["Pop","Soul","Blues"],"description":"A dark pop and soul song about betrayal, heartbreak and finding power in pain, driven by Adele's powerhouse vocals.","metadata_json":{"artist":"Adele","album":"21","mood":["emotional","powerful","heartbreak"]},"release_year":2010,"duration":"3:48","avg_rating":4.7,"total_ratings":840,"poster_url":"https://upload.wikimedia.org/wikipedia/en/1/1e/Adele_-_Rolling_in_the_Deep.png"},
    {"title":"Smells Like Teen Spirit","genres":["Grunge","Alternative Rock"],"description":"The anthem of a generation that captured the disillusionment of youth and helped bring alternative rock to mainstream audiences.","metadata_json":{"artist":"Nirvana","album":"Nevermind","mood":["rebellious","energetic","iconic"]},"release_year":1991,"duration":"5:01","avg_rating":4.8,"total_ratings":780,"poster_url":"https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg"},
    {"title":"Stairway to Heaven","genres":["Rock","Folk Rock","Hard Rock"],"description":"Building from a gentle acoustic guitar intro to a hard-rock crescendo, this eight-minute epic is considered one of the greatest rock songs ever written.","metadata_json":{"artist":"Led Zeppelin","album":"Led Zeppelin IV","mood":["epic","mystical","classic"]},"release_year":1971,"duration":"8:02","avg_rating":4.9,"total_ratings":760,"poster_url":"https://upload.wikimedia.org/wikipedia/en/2/26/Led_Zeppelin_-_Led_Zeppelin_IV.jpg"},
]

COURSES = [
    {"title":"Machine Learning Specialization","genres":["Data Science","Machine Learning","AI"],"description":"Master the fundamentals of machine learning. Learn supervised learning, unsupervised learning, and best practices used in Silicon Valley.","metadata_json":{"instructor":"Andrew Ng","platform":"Coursera","difficulty":"Intermediate","mood":["educational","technical"]},"release_year":2022,"duration":"3 months","avg_rating":4.9,"total_ratings":1200,"poster_url":"https://img-c.udemycdn.com/course/480x270/950390_270f_3.jpg"},
    {"title":"The Complete Web Developer Bootcamp","genres":["Web Development","Programming","Full Stack"],"description":"Become a full-stack web developer with just one course. HTML, CSS, Javascript, Node, React, MongoDB, and more!","metadata_json":{"instructor":"Colt Steele","platform":"Udemy","difficulty":"Beginner","mood":["practical","hands-on"]},"release_year":2023,"duration":"65 hours","avg_rating":4.8,"total_ratings":980,"poster_url":"https://img-c.udemycdn.com/course/480x270/625204_436a_3.jpg"},
    {"title":"Python for Data Science and Machine Learning Bootcamp","genres":["Python","Data Science","Machine Learning"],"description":"Learn how to use NumPy, Pandas, Seaborn, Matplotlib, Plotly, Scikit-Learn, Machine Learning, Tensorflow, and more!","metadata_json":{"instructor":"Jose Portilla","platform":"Udemy","difficulty":"Intermediate","mood":["practical","data-focused"]},"release_year":2022,"duration":"25 hours","avg_rating":4.7,"total_ratings":850,"poster_url":"https://img-c.udemycdn.com/course/480x270/903744_8eb2.jpg"},
    {"title":"React - The Complete Guide","genres":["React","JavaScript","Web Development"],"description":"Dive in and learn React.js from scratch! Learn Reactjs, Hooks, Redux, React Router, Next.js, Best Practices and way more!","metadata_json":{"instructor":"Maximilian Schwarzmüller","platform":"Udemy","difficulty":"Intermediate","mood":["modern","comprehensive"]},"release_year":2023,"duration":"68 hours","avg_rating":4.8,"total_ratings":920,"poster_url":"https://img-c.udemycdn.com/course/480x270/1362070_b9a1_2.jpg"},
    {"title":"Deep Learning Specialization","genres":["Deep Learning","Neural Networks","AI"],"description":"Become an expert in neural networks, deep learning architectures and their applications in computer vision, NLP, and more.","metadata_json":{"instructor":"Andrew Ng","platform":"Coursera","difficulty":"Advanced","mood":["rigorous","theoretical"]},"release_year":2021,"duration":"4 months","avg_rating":4.9,"total_ratings":780,"poster_url":"https://img-c.udemycdn.com/course/480x270/2796760_5e67_10.jpg"},
]

FOOD = [
    {"title":"Margherita Pizza","genres":["Italian","Pizza","Vegetarian"],"description":"The classic Neapolitan pizza topped with fresh tomato sauce, mozzarella, and basil — simple perfection in every slice.","metadata_json":{"cuisine":"Italian","dietary":["vegetarian"],"spice_level":"mild","mood":["comfort","classic"]},"release_year":1889,"duration":"20 min prep","avg_rating":4.7,"total_ratings":680,"poster_url":"https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg"},
    {"title":"Chicken Tikka Masala","genres":["Indian","Curry","Non-Vegetarian"],"description":"Tender marinated chicken grilled in a tandoor and served in a rich, aromatic tomato-based cream sauce with a blend of Indian spices.","metadata_json":{"cuisine":"Indian","dietary":[],"spice_level":"medium-hot","mood":["rich","spicy","comfort"]},"release_year":1970,"duration":"45 min","avg_rating":4.8,"total_ratings":720,"poster_url":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Chicken_tikka_masala.jpg/1280px-Chicken_tikka_masala.jpg"},
    {"title":"Sushi Platter","genres":["Japanese","Seafood","Raw"],"description":"An elegant arrangement of nigiri, maki rolls, and sashimi showcasing the freshest fish with perfectly seasoned rice.","metadata_json":{"cuisine":"Japanese","dietary":["gluten-free"],"spice_level":"mild","mood":["fresh","refined","umami"]},"release_year":1820,"duration":"30 min prep","avg_rating":4.8,"total_ratings":640,"poster_url":"https://upload.wikimedia.org/wikipedia/commons/6/60/Sushi_platter.jpg"},
    {"title":"Beef Tacos","genres":["Mexican","Street Food","Non-Vegetarian"],"description":"Crispy corn tortillas loaded with seasoned ground beef, fresh pico de gallo, shredded cheese, and a drizzle of lime crema.","metadata_json":{"cuisine":"Mexican","dietary":[],"spice_level":"medium","mood":["fun","casual","spicy"]},"release_year":1900,"duration":"25 min","avg_rating":4.6,"total_ratings":590,"poster_url":"https://upload.wikimedia.org/wikipedia/commons/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg"},
    {"title":"Pasta Carbonara","genres":["Italian","Pasta","Non-Vegetarian"],"description":"The authentic Roman pasta dish made with eggs, Pecorino Romano, guanciale, and black pepper — creamy without a drop of cream.","metadata_json":{"cuisine":"Italian","dietary":[],"spice_level":"mild","mood":["rich","comfort","classic"]},"release_year":1944,"duration":"20 min","avg_rating":4.8,"total_ratings":610,"poster_url":"https://upload.wikimedia.org/wikipedia/commons/3/33/Fresh_made_pasta_carbonara.jpg"},
]

PRODUCTS = [
    {"title":"Sony WH-1000XM5 Headphones","genres":["Electronics","Audio","Wireless"],"description":"Industry-leading noise cancellation with 8 microphones, exceptional sound quality, 30-hour battery life, and multi-device pairing.","metadata_json":{"brand":"Sony","category":"Audio","price":379.99,"mood":["premium","focused","music"]},"release_year":2022,"duration":"30 hr battery","avg_rating":4.8,"total_ratings":1100,"poster_url":"https://www.sony.com/image/WH1000XM5_main.jpg"},
    {"title":"Apple MacBook Pro M3","genres":["Laptops","Computers","Apple"],"description":"Blazing fast M3 chip, stunning Liquid Retina XDR display, up to 22 hours battery life, and the best webcam ever in a Mac notebook.","metadata_json":{"brand":"Apple","category":"Computers","price":1999.99,"mood":["professional","premium","creative"]},"release_year":2023,"duration":"22 hr battery","avg_rating":4.9,"total_ratings":860,"poster_url":"https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp-14-spacegray-select-202310.jpg"},
    {"title":"Kindle Paperwhite","genres":["E-Readers","Books","Electronics"],"description":"Thinner, lighter, with a 6.8\" display and adjustable warm light for the ultimate reading experience. Waterproof with weeks of battery life.","metadata_json":{"brand":"Amazon","category":"E-Readers","price":139.99,"mood":["reading","relaxing","focused"]},"release_year":2021,"duration":"10 week battery","avg_rating":4.7,"total_ratings":940,"poster_url":"https://m.media-amazon.com/images/I/61Ww4abGclL.jpg"},
]

# ─── Seeder ──────────────────────────────────────────────────────────────────

def _create_items(db, domain, data_list, genre_key="genres"):
    for d in data_list:
        item = Item(
            title=d["title"],
            domain=domain,
            description=d.get("description",""),
            genres=d.get("genres",[]),
            genre=(d.get("genres") or [""])[0],
            tags=d.get("genres",[]),
            keywords=[d["title"].lower()],
            language="English",
            metadata_json=d.get("metadata_json",{}),
            poster_url=d.get("poster_url",""),
            avg_rating=d.get("avg_rating",4.0),
            total_ratings=d.get("total_ratings",100),
            popularity_score=round(d.get("total_ratings",100) * d.get("avg_rating",4.0) / 5.0, 2),
            release_year=d.get("release_year"),
            duration=d.get("duration",""),
            is_featured=d.get("avg_rating",4.0) >= 4.7,
            is_trending=d.get("total_ratings",0) >= 900,
        )
        db.add(item)


def seed_if_empty():
    init_db()
    db = SessionLocal()
    try:
        if db.query(Item).count() > 0:
            print("Database already seeded, skipping.")
            return

        print("Seeding database...")

        # Create admin user
        if not db.query(User).filter(User.email == "admin@nextrec.ai").first():
            admin = User(
                email="admin@nextrec.ai",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="NextRec Admin",
                is_admin=True,
                onboarding_complete=True,
                preferred_domains=["movies","books","music"],
                preferred_genres=["Sci-Fi","Drama","Thriller"],
            )
            db.add(admin)

        # Create sample users
        sample_users_data = [
            ("alice@example.com","alice","Alice Chen",["movies","books"],["Sci-Fi","Thriller","Drama"]),
            ("bob@example.com","bob","Bob Smith",["music","movies"],["Rock","Action","Comedy"]),
            ("carol@example.com","carol","Carol Davis",["books","courses"],["Fantasy","Self-Help","Programming"]),
            ("dave@example.com","dave","Dave Wilson",["movies","food"],["Action","Italian","Japanese"]),
            ("eve@example.com","eve","Eve Martinez",["music","courses"],["Pop","R&B","Data Science"]),
        ]
        for email, username, name, domains, genres in sample_users_data:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(
                    email=email, username=username,
                    hashed_password=get_password_hash("password123"),
                    full_name=name, is_admin=False, onboarding_complete=True,
                    preferred_domains=domains, preferred_genres=genres,
                ))

        db.commit()

        # Seed items
        _create_items(db, "movies", MOVIES)
        _create_items(db, "books", BOOKS)
        _create_items(db, "music", MUSIC)
        _create_items(db, "courses", COURSES)
        _create_items(db, "food", FOOD)
        _create_items(db, "products", PRODUCTS)
        db.commit()

        # Generate synthetic ratings
        items = db.query(Item).all()
        users = db.query(User).filter(~User.is_admin).all()
        for user in users:
            sampled = random.sample(items, min(15, len(items)))
            for item in sampled:
                domain_pref = item.domain in (user.preferred_domains or [])
                base = 4.0 if domain_pref else 3.0
                noise = random.uniform(-0.5, 1.0)
                rating_val = max(1.0, min(5.0, round(base + noise, 1)))
                db.add(Rating(user_id=user.id, item_id=item.id, rating=rating_val))
        db.commit()

        # Refresh popularity scores
        for item in items:
            ratings = db.query(Rating).filter(Rating.item_id == item.id).all()
            if ratings:
                item.total_ratings = len(ratings)
                item.avg_rating = round(sum(r.rating for r in ratings) / len(ratings), 2)
                item.popularity_score = round(item.total_ratings * item.avg_rating / 5.0, 2)
        db.commit()

        print(f"Seeded {db.query(Item).count()} items, {db.query(User).count()} users, {db.query(Rating).count()} ratings.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_if_empty()
