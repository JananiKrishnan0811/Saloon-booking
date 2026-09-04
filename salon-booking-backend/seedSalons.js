const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./Models/User');
const Salon = require('./Models/Salon');
const Service = require('./Models/Service');
const Staff = require('./Models/Staff');
const Availability = require('./Models/Availability');

const salonSeed = [
  {
    city: 'Salem',
    name: 'Glow Luxe Studio',
    address: 'Fort Road, Salem',
    phone: '0427-220001',
    description: 'Modern salon for hair, bridal and skincare',
  },
  {
    city: 'Salem',
    name: 'Silk & Shine Salon',
    address: 'Gandhi Nagar, Salem',
    phone: '0427-220002',
    description: 'Premium styling and beauty care',
  },
  {
    city: 'Kumbakonam',
    name: 'Royal Bloom Salon',
    address: 'Big Bazaar Street, Kumbakonam',
    phone: '0435-220001',
    description: 'Luxury beauty and spa treatments',
  },
  {
    city: 'Kumbakonam',
    name: 'Pearl Beauty Lounge',
    address: 'Mannargudi Road, Kumbakonam',
    phone: '0435-220002',
    description: 'Hair care, facial and bridal styling',
  },
];

const serviceCatalog = [
  { name: 'Hair Cut', category: 'Hair', price: 250, duration: 45 },
  { name: 'Hair Spa', category: 'Hair', price: 750, duration: 60 },
  { name: 'Facial', category: 'Skin', price: 1200, duration: 60 },
  { name: 'Threading', category: 'Beauty', price: 120, duration: 20 },
  { name: 'Manicure', category: 'Nails', price: 350, duration: 30 },
  { name: 'Bridal Makeup', category: 'Bridal', price: 3000, duration: 120 },
];

const slotTemplates = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:30', endTime: '11:30' },
  { startTime: '12:00', endTime: '13:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:30', endTime: '16:30' },
  { startTime: '17:00', endTime: '18:00' },
];

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toISODate(date) {
  return date.toISOString().split('T')[0];
}

async function createSalonOwner(email, name) {
  const existing = await User.findOne({ email });
  if (existing) return existing;

  const password = await bcrypt.hash('salon123', 10);
  const user = await User.create({
    name,
    email,
    password,
    role: 'salon_owner',
    isActive: true,
  });

  return user;
}

async function createAdmin() {
  const password = await bcrypt.hash('admin123', 10);
  return User.create({
    name: 'System Admin',
    email: 'admin@example.com',
    password,
    role: 'admin',
    isActive: true,
  });
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salon_booking');
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Salon.deleteMany({}),
    Service.deleteMany({}),
    Staff.deleteMany({}),
    Availability.deleteMany({}),
  ]);

  const owner1 = await createSalonOwner('salem.owner@example.com', 'Salem Owner');
  const owner2 = await createSalonOwner('kumbakonam.owner@example.com', 'Kumbakonam Owner');
  await createAdmin();

  const salons = [];
  for (let i = 0; i < salonSeed.length; i += 1) {
    const info = salonSeed[i];
    const owner = i < 2 ? owner1 : owner2;

    const salon = await Salon.create({
      name: info.name,
      description: info.description,
      owner: owner._id,
      address: info.address,
      city: info.city,
      phone: info.phone,
      rating: 4.8,
      isActive: true,
    });

    salons.push(salon);
  }

  for (const salon of salons) {
    const staffMembers = [
      { name: `${salon.name.split(' ')[0]} Stylist 1`, role: 'stylist', specialty: 'Hair Cutting' },
      { name: `${salon.name.split(' ')[0]} Stylist 2`, role: 'stylist', specialty: 'Bridal Styling' },
      { name: `${salon.name.split(' ')[0]} Facial Expert`, role: 'beautician', specialty: 'Facial' },
    ];

    const createdStaff = [];
    for (const member of staffMembers) {
      const staff = await Staff.create({
        salon: salon._id,
        name: member.name,
        role: member.role,
        specialty: member.specialty,
        isActive: true,
      });
      createdStaff.push(staff);
    }

    for (const service of serviceCatalog) {
      await Service.create({
        salon: salon._id,
        name: service.name,
        category: service.category,
        description: `${service.name} service at ${salon.name}`,
        price: service.price,
        duration: service.duration,
        isActive: true,
      });
    }

    const dateList = Array.from({ length: 7 }, (_, index) => toISODate(addDays(new Date(), index + 1)));

    for (const staff of createdStaff) {
      const slots = slotTemplates.map((slot) => ({
        ...slot,
        available: true,
      }));

      for (const date of dateList) {
        await Availability.create({
          staff: staff._id,
          date,
          slots,
        });
      }
    }
  }

  const salonSummary = await Salon.find({}).populate('owner', 'name email');
  console.log('\nSeeded salons:');
  for (const salon of salonSummary) {
    console.log(`${salon.city} - ${salon.name} | Owner: ${salon.owner.name}`);
  }

  const counts = {
    users: await User.countDocuments(),
    salons: await Salon.countDocuments(),
    services: await Service.countDocuments(),
    staff: await Staff.countDocuments(),
    availability: await Availability.countDocuments(),
  };

  console.log('\nCounts:', counts);

  await mongoose.disconnect();
  console.log('MongoDB disconnected');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
