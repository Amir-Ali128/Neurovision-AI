#include <cmath>
extern "C" {
float neural_activation(float visual, float audio, float motion){
    float w = visual*0.5f + audio*0.3f + motion*0.2f;
    return 1.0f/(1.0f+std::exp(-w*5.0f));
}
}
