import { prisma } from '../config/prisma.js';

export const initializeWebSockets = (io) => {

    io.on('connection', (connectedUser) => {
      
      const userId = connectedUser.id;
      console.log(`📱 A new user opened the app! Socket ID: ${userId}`);
  
      // === EVENT 1: ENTERING A POSTER'S ROOM ===
      // The phone emits this when AR detects a previously saved poster
      connectedUser.on('phone_sees_poster', async (posterId) => {
        // 1. Join the specific Poster's live Room
        connectedUser.join(posterId);
        console.log(`👀 Socket ${userId} is viewing poster: ${posterId}`);
        
        // 2. DATABASE MAGIC: Fetch all old Graffiti saved by others
        try {
          const oldDrawings = await prisma.graffiti.findMany({
            where: { posterId: posterId }
          });
          
          // 3. Send the entire "history" to the newly connected user
          // The phone will render these JSON arrays instantly
          connectedUser.emit('load_drawing_history', oldDrawings);

        } catch (error) {
          console.error("Error reading old drawings from DB: ", error);
        }
      });
  
      // === EVENT 2: LIVE DRAWING ON THE POSTER (No Database) ===
      // 60 frames per second traffic! 
      // Do NOT write to DB here, otherwise Supabase will crash under pressure.
      connectedUser.on('user_draws_line_live', (drawingData) => {
        const currentPosterId = drawingData.posterId;
        const newPoint2D = drawingData.coordinates; // {x, y}
        
        // ONLY broadcast the visual X/Y point to others in the room
        connectedUser.to(currentPosterId).emit('receive_live_line', newPoint2D);
      });

      // === EVENT 3: PERMANENTLY SAVING THE DRAWING ===
      // Triggered by the Frontend ONLY WHEN THE USER LIFTS THEIR FINGER OFF THE SCREEN.
      // This sends the full array of coordinates (Vector Array JSON) into the DB.
      connectedUser.on('phone_saves_final_drawing', async (finalPayload) => {
         const { posterId, dbUserId, completeLineJSON } = finalPayload;
         
         try {
           // Prisma cleanly inserts the arrays into PostgreSQL
           await prisma.graffiti.create({
             data: {
               posterId: posterId,        
               userId: dbUserId,
               linesData: completeLineJSON // The massive JSON array [{x:1, y:1}, {x:2, y:2}]
             }
           });
           console.log(`✅ Successfully saved drawing for user ${dbUserId} on poster ${posterId}`);
         } catch (error) {
           console.error("Prisma Save Error:", error);
         }
      });
  
      // === EVENT 4: LEAVING THE POSTER ===
      connectedUser.on('phone_loses_poster', (posterId) => {
        connectedUser.leave(posterId);
        console.log(`🏃 Socket ${userId} withdrew from poster: ${posterId}`);
      });
  
      // === DISCONNECTION ===
      connectedUser.on('disconnect', () => {
        console.log(`❌ Connection closed: ${userId}`);
      });
  
    });
};
