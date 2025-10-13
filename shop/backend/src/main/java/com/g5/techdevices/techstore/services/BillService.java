//package com.g5.techdevices.techstore.services;
//
//import com.g5.techdevices.techstore.dto.BillDTO;
//import com.g5.techdevices.techstore.entity.Bills.Bill;
//import com.g5.techdevices.techstore.entity.users.User;
//import com.g5.techdevices.techstore.exceptions.DataNotFoundException;
//import com.g5.techdevices.techstore.repositories.BillRepository;
//import com.g5.techdevices.techstore.repositories.UserRepository;
//import com.g5.techdevices.techstore.responses.BillResponse;
//import lombok.RequiredArgsConstructor;
//import org.modelmapper.ModelMapper;
//import org.springframework.stereotype.Service;
//
//import java.util.Date;
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//public class BillService implements IBillService{
//    private final UserRepository userRepository;
//    private final BillRepository billRepository;
//    private final ModelMapper modelMapper =new ModelMapper();
//
//    @Override
//    public BillResponse createBill(BillDTO billDTO) throws DataNotFoundException{
//       User user= userRepository
//               .findById(billDTO.getUserId())
//               .orElseThrow(() -> new DataNotFoundException("Cannot not find user with id: "+billDTO.getUserId()));
//       modelMapper.typeMap(BillDTO.class, Bill.class)
//               .addMappings(mapper -> mapper.skip(Bill::setId));
//       Bill bill=new Bill();
//       modelMapper.map(billDTO,bill);
//       bill.setUser(user);
//       bill.setBillDate(new Date());
//       bill.setStatus("Pending");
//       Date shippingDate = billDTO.getShippingDate();
//       if(shippingDate == null || shippingDate.before(new Date())){
//           throw new DataNotFoundException("Data must be at least today !");
//       }
//       bill.setActive(true);
//       billRepository.save(bill);
//       return modelMapper.map(bill, BillResponse.class);
//    }
//    @Override
//    public BillResponse getBill(long id) {
//       return billRepository.findById(id).orElse(null);
//
//    }
//    @Override
//    public BillResponse updateBill(long id, BillDTO billDTO) throws DataNotFoundException {
//        Bill existingBill=billRepository.findById(id).orElseThrow(() -> new DataNotFoundException("Cannot find bill with id: "+id));
//        User existingUser=userRepository.findById(id).orElseThrow(() -> new DataNotFoundException("Cannot find user with id: "+id));
//        modelMapper.typeMap(BillDTO.class,Bill.class)
//                .addMappings(mapper -> mapper.skip(Bill::setId));
//        return null;
//    }
//    @Override
//    public void deleteBill(long id){
//        return;
//    }
//    @Override
//    public List<BillResponse> findById(long userId){
//        return null;
//    }
//}
