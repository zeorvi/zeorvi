import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/lib/googleSheetsService";
import { getSpreadsheetId } from "@/lib/restaurantSheets";

export async function GET() {
  try {
    console.log("🧪 Testing Google Sheets connection...");
    
    // Test La Gaviota (rest_003)
    const id = getSpreadsheetId("rest_003");
    const rows = await GoogleSheetsService.getReservas("rest_003");
    
    console.log(`✅ Sheets connection successful: ${rows.length} reservations found`);
    
    return NextResponse.json({ 
      success: true,
      restaurantId: "rest_003",
      spreadsheetId: id,
      reservationsCount: rows.length,
      message: "Google Sheets connection working correctly"
    });
    
  } catch (error) {
    console.error("❌ Google Sheets test failed:", error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Google Sheets connection failed"
    }, { status: 500 });
  }
}

