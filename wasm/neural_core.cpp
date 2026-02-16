#include <cmath>
extern "C" {
float wasm_neural_step(float stimulus){
    return 1.0f/(1.0f+std::exp(-stimulus*6.0f));
}
}
