import { Suspense } from 'react';
import AgentHotelDetails from '../../../../components/AgentHotelDetails';

export default async function HotelDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const hotelId = parseInt(params.id, 10);
  
  if (isNaN(hotelId)) {
    return <div className="p-8 text-center text-red-500">Invalid Hotel ID</div>;
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading hotel details...</div>}>
      <AgentHotelDetails hotelId={hotelId} />
    </Suspense>
  );
}
