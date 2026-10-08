import { pool } from '../config/database';
import { logger } from '../utils/logger';

type SeedMinistry = {
  code: string; name: string; description: string; meeting_day: string;
  meeting_venue: string; image_url: string;
};
type SeedProgramme = {
  id: string; day: string; title: string; programme_type: string; time: string;
  venue: string; leader: string; description: string; alternating_enabled?: number;
  interval_type?: string; alternate_a_title?: string; alternate_b_title?: string;
  anchor_monday?: string; anchor_programme?: string; is_configurable?: number;
};
type SeedEvent = {
  id: string; title: string; event_type: string; description?: string | null;
  start_at: string; end_at?: string | null; location?: string | null;
  venue?: string | null; preacher?: string | null; speaker?: string | null;
  topic?: string | null; theme?: string | null; status?: string; capacity?: number | null;
};

const MINISTRIES: SeedMinistry[] = [
  {
    "code": "intercessory",
    "name": "Intercessory Ministry",
    "description": "Dedicated to prayer, fasting, and spiritual intercession for the CU and campus.",
    "meeting_day": "Wednesdays & Fridays",
    "meeting_venue": "Main Chapel",
    "image_url": "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "worship",
    "name": "Praise & Worship Ministry",
    "description": "Leading the congregation into the manifest presence of God through spirit-filled worship.",
    "meeting_day": "Tuesdays & Thursdays",
    "meeting_venue": "Assembly Hall",
    "image_url": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "instrumentalists",
    "name": "Instrumentalists Ministry",
    "description": "Skillfully ministering with musical instruments to support worship services.",
    "meeting_day": "Tuesdays & Saturdays",
    "meeting_venue": "Music Room",
    "image_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "ushering",
    "name": "Ushering Ministry",
    "description": "Welcoming believers, maintaining order, and fostering hospitality in all gatherings.",
    "meeting_day": "Thursdays",
    "meeting_venue": "Chapel Foyer",
    "image_url": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "catering",
    "name": "Catering Ministry",
    "description": "Managing hospitality, food, and refreshments during CU events, AGMs, and conferences.",
    "meeting_day": "Saturdays before events",
    "meeting_venue": "Dining Hall Kitchen",
    "image_url": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "media",
    "name": "Media Ministry",
    "description": "Audio-visual production, livestreaming, photography, and digital ministry outreach.",
    "meeting_day": "Fridays",
    "meeting_venue": "Media Studio",
    "image_url": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "creative",
    "name": "Creative Ministry",
    "description": "Proclaiming the Gospel through Christian drama, poetry, spoken word, and dance.",
    "meeting_day": "Mondays & Wednesdays",
    "meeting_venue": "Amphitheatre",
    "image_url": "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "technicians",
    "name": "Technicians Ministry",
    "description": "Sound engineering, electrical setup, lighting, and stage technical management.",
    "meeting_day": "Saturdays",
    "meeting_venue": "Control Booth",
    "image_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "high_school",
    "name": "High School Ministry",
    "description": "Evangelism, mentorship, and discipleship missions to secondary schools in Mombasa.",
    "meeting_day": "Sundays",
    "meeting_venue": "Room B10",
    "image_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "hospital",
    "name": "Hospital Ministry",
    "description": "Visiting patients in Coast General and local clinics with prayers and care packages.",
    "meeting_day": "Saturdays",
    "meeting_venue": "Hospital Gate",
    "image_url": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "brothers",
    "name": "Brothers' Ministry",
    "description": "Building godly men through fellowship, accountability, and leadership development.",
    "meeting_day": "Alternate Fridays",
    "meeting_venue": "Hostel Courtyard",
    "image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    "code": "sisters",
    "name": "Sisters' Ministry",
    "description": "Nurturing virtuous women of faith, character, and spiritual excellence.",
    "meeting_day": "Alternate Fridays",
    "meeting_venue": "Chapel Hall",
    "image_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
  }
];

const WEEKLY_PROGRAMMES: SeedProgramme[] = [
  {
    "id": "104208d7-106c-5e33-b38a-bebf0a2f2966",
    "day": "Monday",
    "title": "Door to Door & E-Teams Fellowship",
    "programme_type": "evangelism",
    "time": "5:00 PM – 7:00 PM",
    "venue": "Assembly Grounds & Designated Centers",
    "leader": "Evangelism & E-Teams Committee",
    "description": "Alternating weekly evangelism: E-Teams Fellowship one Monday, Door to Door Evangelism the next Monday.",
    "alternating_enabled": 1,
    "interval_type": "biweekly",
    "alternate_a_title": "E-Teams Fellowship",
    "alternate_b_title": "Door to Door Evangelism",
    "anchor_monday": "2026-09-21",
    "anchor_programme": "alternate_a"
  },
  {
    "id": "71bda34d-3bba-5d94-a8b7-1b84d508d1de",
    "day": "Tuesday",
    "title": "Bible Study (BEST)",
    "programme_type": "bible_study",
    "time": "5:00 PM – 7:00 PM",
    "venue": "Lecture Theatres & Designated Classes",
    "leader": "Bible Study Ministry",
    "description": "Systematic verse-by-verse scripture study, discipleship cohorts, and small group discussions.",
    "alternating_enabled": 0
  },
  {
    "id": "03c4f727-5bb1-5427-87fe-ab487c7579a5",
    "day": "Wednesday",
    "title": "Discipleship Class",
    "programme_type": "discipleship",
    "time": "5:00 PM – 7:00 PM",
    "venue": "Main Sanctuary / Assembly Hall",
    "leader": "Discipleship Ministry",
    "description": "Foundational Christian doctrine and spiritual growth mentorship for disciples.",
    "alternating_enabled": 0
  },
  {
    "id": "70b57cb8-28fb-536b-844f-6008184d5231",
    "day": "Thursday",
    "title": "Empowerment Service",
    "programme_type": "empowerment",
    "time": "5:00 PM – 7:00 PM",
    "venue": "Main Sanctuary / Assembly Hall",
    "leader": "Empowerment Ministry",
    "description": "Spiritual, academic, leadership, and career empowerment for campus believers.",
    "alternating_enabled": 0
  },
  {
    "id": "c3295c4e-5525-56d6-a4f2-15b73472097d",
    "day": "Friday",
    "title": "Friday Main Service",
    "programme_type": "fellowship",
    "time": "6:00 PM – 8:30 PM",
    "venue": "Assembly Hall",
    "leader": "Executive Committee & Music Ministry",
    "description": "Dynamic campus fellowship, deep worship, testimonies, and practical scriptural preaching.",
    "alternating_enabled": 0
  },
  {
    "id": "146033ba-f50f-5e9d-9baa-f896d8bc2272",
    "day": "Sunday",
    "title": "Sunday Service",
    "programme_type": "service",
    "time": "8:00 AM – 12:30 PM",
    "venue": "Main Assembly Hall / Sanctuary",
    "leader": "Executive Committee",
    "description": "Sunday morning corporate worship, celebration, Word, and communion.",
    "alternating_enabled": 0,
    "is_configurable": 1
  }
];

const EVENTS: SeedEvent[] = [
  {
    "id": "95ac8046-e9cc-5fae-91b4-1d9ca234b459",
    "title": "Friday Service: Knowing Who You Are in Christ",
    "event_type": "service",
    "description": "Foundational fellowship service opening the semester spiritual theme: Manifesting the Light of Christ.",
    "start_at": "2026-09-04T18:00:00Z",
    "end_at": "2026-09-04T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Meshack / TUMCU Patron",
    "status": "published"
  },
  {
    "id": "61f2dd9d-5149-5f25-ae59-7db413f6eb1e",
    "title": "Friday Service: The Power of a Consecrated Life",
    "event_type": "service",
    "description": "Exhortation on personal purity, devotion, and living a dedicated life on campus.",
    "start_at": "2026-09-11T18:00:00Z",
    "end_at": "2026-09-11T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Pst. Otieno",
    "status": "published"
  },
  {
    "id": "00e2e5bd-b0c8-5b96-a81a-67557dc43380",
    "title": "Friday Service: Overcoming Iniquities & Walking in Victory",
    "event_type": "service",
    "description": "Overcoming trials, temptation, and walking in the fullness of Christ victory.",
    "start_at": "2026-09-18T18:00:00Z",
    "end_at": "2026-09-18T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Rev. Barasa",
    "status": "published"
  },
  {
    "id": "177684a1-dfef-5dfb-803d-27c235a914b4",
    "title": "Friday Service: Walking as Children of Light",
    "event_type": "service",
    "description": "Living out Matthew 5:16 as shining beacons in lecture halls, hostels, and student associations.",
    "start_at": "2026-09-25T18:00:00Z",
    "end_at": "2026-09-25T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Bro. Caleb (CU Chairperson)",
    "status": "published"
  },
  {
    "id": "1bdff453-013e-56e5-8181-a89d797fb211",
    "title": "Friday Service: The Cost and Joy of Discipleship",
    "event_type": "service",
    "description": "Exploring biblical discipleship and the cost of bearing one cross with joy.",
    "start_at": "2026-10-02T18:00:00Z",
    "end_at": "2026-10-02T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Pst. Mwangi",
    "status": "published"
  },
  {
    "id": "d11556de-f2ce-5369-bc43-626e3e7639e1",
    "title": "Friday Service: Standing Firm in Campus Culture",
    "event_type": "service",
    "description": "Navigating peer pressure, academic stress, and modern campus culture with biblical conviction.",
    "start_at": "2026-10-09T18:00:00Z",
    "end_at": "2026-10-09T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Sis. Faith (Secretary)",
    "status": "published"
  },
  {
    "id": "aa56aefd-71b6-5bda-bcfe-48c4eac0ec5c",
    "title": "Friday Service: The Armor of God & Spiritual Warfare",
    "event_type": "service",
    "description": "Deep exposition of Ephesians 6 and prevailing in faith through corporate spiritual armor.",
    "start_at": "2026-10-16T18:00:00Z",
    "end_at": "2026-10-16T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Ev. David (1st Vice Chairperson)",
    "status": "published"
  },
  {
    "id": "2cbd10db-a38f-5e25-839e-4a7606d9f836",
    "title": "Friday Service: Power of Corporate Prayer & Fasting",
    "event_type": "service",
    "description": "Igniting collective prayer altars across campus and hostels.",
    "start_at": "2026-10-23T18:00:00Z",
    "end_at": "2026-10-23T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Pst. Steve (2nd Vice Chairperson)",
    "status": "published"
  },
  {
    "id": "e1ba7847-c127-5a34-8f2e-8a55e064a6de",
    "title": "Friday Service: Kingdom Stewardship & Faithfulness",
    "event_type": "service",
    "description": "Managing time, gifts, career callings, and resources for the glory of God.",
    "start_at": "2026-10-30T18:00:00Z",
    "end_at": "2026-10-30T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Bro. Meshack (Treasurer)",
    "status": "published"
  },
  {
    "id": "97ccb018-6fad-5290-ae98-af3f13b4ee76",
    "title": "Friday Service: Living on Mission — Reaching the Lost",
    "event_type": "service",
    "description": "Evangelism focus, sharing the gospel with boldness across university faculties and Coast region.",
    "start_at": "2026-11-06T18:00:00Z",
    "end_at": "2026-11-06T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Pst. Ochieng",
    "status": "published"
  },
  {
    "id": "9bf13efc-42ce-5ec8-abf5-2ac33927fe78",
    "title": "Friday Service: Abiding in the Vine",
    "event_type": "service",
    "description": "John 15 reflection on remaining in Christ for enduring fruitfulness.",
    "start_at": "2026-11-13T18:00:00Z",
    "end_at": "2026-11-13T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Rev. Mutua",
    "status": "published"
  },
  {
    "id": "1b4b7585-f2f4-5582-a4c1-43bb928cb02d",
    "title": "Friday Service: Grace Sufficient for Every Trial",
    "event_type": "service",
    "description": "Comfort, resilience, and supernatural strength as examination season draws near.",
    "start_at": "2026-11-20T18:00:00Z",
    "end_at": "2026-11-20T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Pst. Kemboi",
    "status": "published"
  },
  {
    "id": "b2fc8174-8022-508d-ad83-84242606eef1",
    "title": "Friday Service: Finishing the Race with Joy",
    "event_type": "service",
    "description": "Concluding teachings for the semester with celebration, awards, and encouragement.",
    "start_at": "2026-11-27T18:00:00Z",
    "end_at": "2026-11-27T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Patron & Executive Committee",
    "status": "published"
  },
  {
    "id": "9665d316-b215-55fb-9722-5b4f016d42f9",
    "title": "Friday Service: The Eternal Light — Hope of Glory",
    "event_type": "service",
    "description": "Semester wrap-up worship night and thanksgiving fellowship.",
    "start_at": "2026-12-04T18:00:00Z",
    "end_at": "2026-12-04T20:30:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "CU Elders & Pastoral Board",
    "status": "published"
  },
  {
    "id": "60d430aa-dfcd-5c8f-883c-cc8df95bbaf4",
    "title": "Orientation & Welcome Sunday: You Are the Light",
    "event_type": "service",
    "description": "Welcoming first years, returning students, and dedicating the academic and spiritual year.",
    "start_at": "2026-09-06T08:00:00Z",
    "end_at": "2026-09-06T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Patron & Executive",
    "status": "published"
  },
  {
    "id": "49e579fc-7465-5ecf-9c11-69f60622b004",
    "title": "Commitment & Commissioning Sunday",
    "event_type": "service",
    "description": "Signing the doctrinal basis, constitutional pledge, and dedicating ministry teams.",
    "start_at": "2026-09-13T08:00:00Z",
    "end_at": "2026-09-13T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "CU Patron",
    "status": "published"
  },
  {
    "id": "40e9fae9-066d-502b-9055-d7524d6ba885",
    "title": "Ministry Sunday: Presentations & Enrolment",
    "event_type": "service",
    "description": "Praise & Worship, Ushering, Media, Instrumentalists, and Discipleship ministry showcase.",
    "start_at": "2026-09-20T08:00:00Z",
    "end_at": "2026-09-20T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Ministry Leaders Council",
    "status": "published"
  },
  {
    "id": "fc3ea267-1eff-5961-ae86-ccfc5f65ab5a",
    "title": "Old School Sunday: Heritage of Faith",
    "event_type": "service",
    "description": "Celebrating the historical roots of TUM Christian Union with classic hymns and attire.",
    "start_at": "2026-09-27T08:00:00Z",
    "end_at": "2026-09-27T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Senior Alumni Minister",
    "status": "published"
  },
  {
    "id": "f95b1a9d-f998-51bc-b2d5-724990ead360",
    "title": "Staff & Faculty Appreciation Sunday",
    "event_type": "service",
    "description": "Honoring university Christian staff, faculty mentors, and campus leadership.",
    "start_at": "2026-10-04T08:00:00Z",
    "end_at": "2026-10-04T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Christian Faculty Dean",
    "status": "published"
  },
  {
    "id": "c15b1016-6b5a-5a72-bbe8-78909fbdf1d2",
    "title": "Mission Follow-Up Sunday",
    "event_type": "service",
    "description": "Testimonies, convert follow-up, and report from evangelistic outreaches.",
    "start_at": "2026-10-11T08:00:00Z",
    "end_at": "2026-10-11T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Mission Director",
    "status": "published"
  },
  {
    "id": "e10fd88c-fe28-5228-9fec-58507b83137d",
    "title": "E-Teams Sunday: NORET & SORET Commissioning",
    "event_type": "service",
    "description": "Evangelism teams regional showcase, commissioning, and prayer for community outreach.",
    "start_at": "2026-10-18T08:00:00Z",
    "end_at": "2026-10-18T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "NORET & SORET Chairpersons",
    "status": "published"
  },
  {
    "id": "ac445b1d-7cc4-58f8-b96d-2c2ef1835a06",
    "title": "Welfare Sunday: Bearing One Another Burdens",
    "event_type": "service",
    "description": "Special love offering, compassionate support for needy students, and fellowship meal.",
    "start_at": "2026-10-25T08:00:00Z",
    "end_at": "2026-10-25T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Welfare Committee Head",
    "status": "published"
  },
  {
    "id": "0e83d426-0045-5a1b-958d-80f68c259e4e",
    "title": "Word Explosion Sunday: Spiritual Awakening",
    "event_type": "service",
    "description": "Climax of the Word Explosion weekend conference with powerful keynote preaching.",
    "start_at": "2026-11-01T08:00:00Z",
    "end_at": "2026-11-01T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Guest Speaker",
    "status": "published"
  },
  {
    "id": "6831e113-9a38-542e-95dd-0b8d026bb441",
    "title": "Associates Sunday & Weekend",
    "event_type": "service",
    "description": "Welcoming graduated TUMCU alumni and associates for mentorship, networking, and support.",
    "start_at": "2026-11-08T08:00:00Z",
    "end_at": "2026-11-08T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "FOCUS Kenya Associate",
    "status": "published"
  },
  {
    "id": "14a37504-5038-5c55-b048-89f9759613b3",
    "title": "Brothers & Sisters Day Sunday",
    "event_type": "service",
    "description": "Joint fellowship celebrating godly brotherhood and sisterhood in purity and honour.",
    "start_at": "2026-11-15T08:00:00Z",
    "end_at": "2026-11-15T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Family Life Minister",
    "status": "published"
  },
  {
    "id": "8356bc2a-8020-5636-8fd7-5c97d8129776",
    "title": "Finalists Dedication & Commissioning Sunday",
    "event_type": "service",
    "description": "Anointing and blessing graduating students as they enter the marketplace and ministry.",
    "start_at": "2026-11-22T08:00:00Z",
    "end_at": "2026-11-22T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "TUMCU Patron",
    "status": "published"
  },
  {
    "id": "3784a6f6-eba4-567b-8192-b0c286cbb57b",
    "title": "Christmas Carols & Worship Extravaganza",
    "event_type": "service",
    "description": "Joyful seasonal worship celebrating the birth of Jesus Christ with choir and instruments.",
    "start_at": "2026-11-29T08:00:00Z",
    "end_at": "2026-11-29T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Music & Creative Ministry",
    "status": "published"
  },
  {
    "id": "05472ca9-8eb3-52cb-9db9-8f59fe6366a6",
    "title": "Semester Thanksgiving & Transition Service",
    "event_type": "service",
    "description": "Corporate thanksgiving service testifying of God goodness and preservation all semester.",
    "start_at": "2026-12-06T08:00:00Z",
    "end_at": "2026-12-06T12:30:00Z",
    "location": "Main Sanctuary / Assembly Hall",
    "venue": "Main Sanctuary / Assembly Hall",
    "preacher": "Executive Leadership",
    "status": "published"
  },
  {
    "id": "a657fbbb-2bee-5066-86ab-1372102655fa",
    "title": "Beach Retreat & Fellowship",
    "event_type": "retreat",
    "description": "Bonding, team building, praise, and prayer on the scenic Mombasa coast.",
    "start_at": "2026-09-19T08:30:00Z",
    "end_at": "2026-09-19T17:00:00Z",
    "location": "Nyali Beach / Waterfront Grounds",
    "venue": "Nyali Beach / Waterfront Grounds",
    "preacher": "Executive Committee",
    "status": "published"
  },
  {
    "id": "9a5750cd-5ac4-5517-abec-29c4e5b65207",
    "title": "Evangelistic Week: Coast Campus Impact",
    "event_type": "mission",
    "description": "Campus-wide evangelistic campaign, lunch hour preaching, and hostel gospel visitation.",
    "start_at": "2026-09-28T09:00:00Z",
    "end_at": "2026-10-02T18:00:00Z",
    "location": "TUM Main Campus & Hostels",
    "venue": "TUM Main Campus & Hostels",
    "preacher": "Mission Team & Ev. David",
    "status": "published"
  },
  {
    "id": "40f39860-9ef5-58e5-be4d-f7ab5ebef50d",
    "title": "Night of Encounter — Prayer Kesha",
    "event_type": "service",
    "description": "All-night prayer vigil, spiritual revival, repentance, and intercession.",
    "start_at": "2026-10-16T22:00:00Z",
    "end_at": "2026-10-17T05:00:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Prayer Committee & Invited Intercessors",
    "status": "published"
  },
  {
    "id": "7ecc8c7c-e29b-5eb3-a1fb-f9e90dc36ae8",
    "title": "Leaders Training & Ministry Impartation Workshop",
    "event_type": "meeting",
    "description": "Equipping subcommittee members, bible study leaders, and ministry stewards in servant leadership.",
    "start_at": "2026-10-24T09:00:00Z",
    "end_at": "2026-10-24T15:00:00Z",
    "location": "Science Complex Hall 2",
    "venue": "Science Complex Hall 2",
    "preacher": "FOCUS Kenya Staff & Elders",
    "status": "published"
  },
  {
    "id": "2fab4455-1835-5eff-a267-bce50320b467",
    "title": "Regional Campus Christian Union Kesha",
    "event_type": "service",
    "description": "Joint inter-university kesha uniting Christian unions across Mombasa and coastal universities.",
    "start_at": "2026-11-06T22:00:00Z",
    "end_at": "2026-11-07T05:00:00Z",
    "location": "Main Assembly Hall",
    "venue": "Main Assembly Hall",
    "preacher": "Regional FOCUS Representatives",
    "status": "published"
  },
  {
    "id": "18746176-4017-5735-910c-13ad74a0e2a1",
    "title": "Word Explosion Conference: Manifesting His Light",
    "event_type": "fellowship",
    "description": "Three days of transformative scripture exposition, seminar tracks, and worship.",
    "start_at": "2026-11-13T16:00:00Z",
    "end_at": "2026-11-15T18:00:00Z",
    "location": "Assembly Hall",
    "venue": "Assembly Hall",
    "preacher": "Keynote Speakers & Ministers",
    "status": "published"
  },
  {
    "id": "1149287f-1bad-5417-989e-ae84a21aaad7",
    "title": "I-Purpose Youth & Career Summit",
    "event_type": "fellowship",
    "description": "Discovering divine calling, career excellence, innovation, and leadership in the marketplace.",
    "start_at": "2026-11-21T09:00:00Z",
    "end_at": "2026-11-21T16:00:00Z",
    "location": "University Conference Centre",
    "venue": "University Conference Centre",
    "preacher": "Industry Leaders & Christian Professionals",
    "status": "published"
  },
  {
    "id": "0f3e148a-a108-540b-96c1-c720b0524e63",
    "title": "Annual General Meeting (AGM) & Leadership Transition",
    "event_type": "meeting",
    "description": "Constitutional AGM, presentation of annual reports, audited financial accounts, and elections transition.",
    "start_at": "2026-11-28T14:00:00Z",
    "end_at": "2026-11-28T18:00:00Z",
    "location": "Main Assembly Hall",
    "venue": "Main Assembly Hall",
    "preacher": "Executive Committee & Electoral Commission",
    "status": "published"
  }
];

function eventType(value?: string | null): string {
  const allowed = new Set([
    'weekly_fellowship','service','sunday_service','fellowship','worship_night',
    'missions','mission','evangelism','high_school_mission','retreat','conference',
    'leadership_summit','bible_study','prayer_retreat','training','agm','sgm',
    'meeting','camp','empowerment','discipleship','graduation_thanksgiving','other',
  ]);
  return allowed.has(value || '') ? (value as string) : 'other';
}

/**
 * Initial public content is inserted only when the row does not already exist.
 * Existing admin edits are therefore never overwritten by a deployment restart.
 */
export async function seedOperationalContent(organizerUserId?: string) {
  for (const m of MINISTRIES) {
    await pool.query(
      `UPDATE ministries
          SET description = COALESCE(NULLIF(description, ''), :description),
              meeting_day = COALESCE(NULLIF(meeting_day, ''), :meeting_day),
              meeting_venue = COALESCE(NULLIF(meeting_venue, ''), :meeting_venue),
              background_image_url = COALESCE(NULLIF(background_image_url, ''), :image_url),
              landing_image_url = COALESCE(NULLIF(landing_image_url, ''), :image_url),
              landing_caption = COALESCE(NULLIF(landing_caption, ''), :name)
        WHERE code = :code`,
      m
    );
  }

  for (const p of WEEKLY_PROGRAMMES) {
    const programmeType = p.programme_type === 'empowerment' || p.programme_type === 'service'
      ? 'midweek_fellowship'
      : p.programme_type;
    await pool.query(
      `INSERT IGNORE INTO weekly_programmes
       (id, programme_type, theme, scheduled_at, venue, created_by, day, title, time, leader,
        description, is_active, display_order, alternating_mode, updated_at)
       VALUES
       (:id, :programme_type, NULL, NULL, :venue, NULL, :day, :title, :time, :leader,
        :description, TRUE, :display_order, :alternating_mode, NOW())`,
      {
        id: p.id, programme_type: programmeType, venue: p.venue, day: p.day, title: p.title,
        time: p.time, leader: p.leader, description: p.description,
        display_order: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(p.day) + 1,
        alternating_mode: p.alternating_enabled ? 'monday_alternate' : 'none',
      }
    );
  }

  if (organizerUserId) {
    for (const e of EVENTS) {
      const status = ['approved','registration_open','ongoing','completed'].includes(e.status || '')
        ? e.status
        : 'approved';
      await pool.query(
        `INSERT IGNORE INTO events
         (id, title, event_type, description, start_at, end_at, location, organized_by,
          status, capacity, registration_deadline, speaker, topic, banner_url)
         VALUES
         (:id, :title, :event_type, :description, :start_at, :end_at, :location, :organized_by,
          :status, :capacity, NULL, :speaker, :topic, NULL)`,
        {
          id: e.id, title: e.title, event_type: eventType(e.event_type),
          description: e.description || null, start_at: e.start_at, end_at: e.end_at || null,
          location: e.location || e.venue || null, organized_by: organizerUserId, status,
          capacity: e.capacity ?? null, speaker: e.speaker || e.preacher || null,
          topic: e.topic || e.theme || null,
        }
      );
    }
  }

  logger.info({
    ministries: MINISTRIES.length,
    weeklyProgrammes: WEEKLY_PROGRAMMES.length,
    events: organizerUserId ? EVENTS.length : 0,
  }, 'Operational public content bootstrap completed.');
}
