package com.cynovan.janus;


import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.RandomUtils;
import org.bson.Document;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest
public class TestImpl2Test {
    @Test
    public void test(){

        String[] types = new String[]{"冷饮","快餐","中餐"};
        for (int i=0;i<100;i++){
            Document saleState= DocumentLib.newDoc();
            saleState.put("name", "product" + i);
            int pickType= RandomUtils.nextInt(0,3);
            saleState.put("type",types[pickType]);
            int pickNum = RandomUtils.nextInt(0, 100);
            saleState.put("num", pickNum);
            int pickPrice= RandomUtils.nextInt(0,1000);
            saleState.put("price",pickPrice);
            DBUtils.save("productSale",saleState);
        }
    }


}