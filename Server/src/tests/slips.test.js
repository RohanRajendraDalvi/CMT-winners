import axios from "axios";

async function testSlip() {
  try {
    // 1. Create slip
    const createRes = await axios.post("http://localhost:5000/slip/report", {
      vehicleId: "VH-TEST-001",
      location: { lat: 42.3601, lon: -71.0589 },
      timestamp: new Date().toISOString()
    });

    console.log("Slip created:");
    console.log(createRes.data);

    const slipId = createRes.data.data._id; // adjust if your response shape is different
    console.log("Created Slip ID:", slipId);

    // 2. Delete slip
    const deleteRes = await deleteSlip(slipId);

    console.log("Delete result:");
    console.log(deleteRes.data);

    console.log("✔ Test completed successfully");

  } catch (err) {
    console.error("❌ Error during slip test:");
    console.error(err.response?.data || err.message);
  }
}

testSlip();
