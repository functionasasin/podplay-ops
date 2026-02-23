========== monorepo ==========
[NO README FOUND]


========== slipstream ==========
[BRANCH: main]
# Slipstream

Local AI swim coach for an endless pool.

## Documentation

All design documents and specifications are in the [`thoughts/`](./thoughts/) directory:

- [Documentation Index](./thoughts/index.md) - Overview of all documentation
- [Technical Spec](./thoughts/specs/technical-spec.md) - System architecture
- [User Journey](./thoughts/specs/user-journey.md) - User experience flow
- [Implementation Plan](./thoughts/plans/implementation-plan.md) - Development roadmap
- [Project Structure](./thoughts/project-structure.md) - Codebase organization

## Status

**Phase**: Planning / Pre-implementation

See the [Implementation Plan](./thoughts/plans/implementation-plan.md) for the 9-branch parallel development strategy.


========== second-brain ==========
[NO README FOUND]


========== succession-ph ==========
[NO README FOUND]


========== clsandoval.github.io ==========
[NO README FOUND]


========== herald-scraper-bot ==========
[NO README FOUND]


========== macromap ==========
[NO README FOUND]


========== LPRnet-keras ==========
[BRANCH: main]
# LPRnet-keras
A keras implementation of the network proposed in https://arxiv.org/abs/1806.10447
LPRnet is a fully end to end licence plate recognition network with the following priorities:

1. Parameter efficiency
2. Speed

This repo contains all the code necessary to train LPRnet on a synthetic dataset
## Notes
1. Utilizes separable convolutional layers as opposed to the normal convolutional layers used in the paper.
2. Training data is generated at train time. 
3. Dataset generation adopted from https://github.com/bluesy7585/tensorflow_LPRnet
4. Dataset augmentation adopted from the proposed system in https://arxiv.org/abs/2108.06949, code available at https://github.com/roatienza/straug

## Training
To train LPRnet, run the following script to train with 10000 epochs.
```shell
python train.py 10000
```

## Demos
This script runs a quick demo of LPRnet on a video using MobileNetV2SSD-FPNLite as the licence plate detector.
```shell 
python demo/sync.py
```
## Dataset generation
A keras generator is used to generate synthetic images at train time. Fonts are located in ```\fonts```. 
A sample set of synthetic plates is shown below. 

![plates](docs/sample_plates.png)
## Model architecture
The model architecture is implemented with the following modifications:

1. Depthwise separable convolutional layers are used as a drop in replacement for the regular convolutional layers.
2. Global context is used concatenating each small basic block as suggested in the paper.

A diagram of the architecture is shown below.
![Architecture](docs/LPRnet.png)
## Looking forward 
1. Improve synthetic data generation. 
2. Make implementation compatible with google's coral TPU compiler. Currently only 32/52 ops are mapped to the TPU (no depthwise layers)
3. Test training without synthetic data with annotated images of licence plates.


========== market-viz-agent ==========
[BRANCH: main]
# OpenAI Assistant

You can deploy your OpenAI assistant with Chainlit using this template.
![openai-assistant](https://github.com/Chainlit/openai-assistant/assets/13104895/5c095a89-e426-417e-977d-772c4d4974c2)

### Supported Assistant Features

| Streaming | Files | Code Interpreter | File Search | Voice |
| --------- | ----- | ---------------- | ----------- | ----- |
| ✅        | ✅    | ✅               | ✅          | ✅    |

### Get an OpenAI API key

Go to OpenAI's [API keys page](https://platform.openai.com/api-keys) and create one if you don't have one already.

### Create an Assistant

Go to OpenAI's [assistant page](https://platform.openai.com/assistants) and click on the `Create` at the top right.

Configure your assistant.

### [Optional] Get a Literal AI API key

> [!NOTE]  
> Literal AI is an all in one observability, evaluation and analytics platform for building LLM apps.

Go to [Literal AI](https://cloud.getliteral.ai/), create a project and go to Settings to get your API key.

### Deploy

Click on the button below, then set the API keys in the form and click on `Apply`.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)


========== course-scrape-tool ==========
[BRANCH: main]
# course-scrape-tool
get free ppts and lecture notes from top universities


========== yolos-lph ==========
[NO README FOUND]


========== alpha-zero-c4 ==========
[BRANCH: main]
# alpha-zero-c4
An implementation of alphazero specifically for connect 4.


========== match-scraper ==========
[NO README FOUND]


========== coral_tpu ==========
[BRANCH: main]
# Coral-TPU
A collection of scripts to compile existing tf (2.0) + keras models to an edge TPU compatible format. Currently tested with the following models.
1. LPRnet
2. MobilenetV2-SSDLite 
## LPRnet 
43 ops mapped to TPU, 32 ops mapped to CPU.

## MobilenetV2-SSDLite (Retrained with TF Object Detection API)
112 ops mapped to TPU, 54 ops mapped to CPU

## Config 
Indicate necessary constants in ``` config.py```


========== ocaml-probset ==========
[BRANCH: master]
# ocaml-probset
### Problem set for my Ocaml class

Transpiles into string that can be copy-pasted into Python repl to execute the following functions

* Golomb term of n
* Reversal of a list (ex. [1;2;3;NIL])


All numbers are expressed in Church numerals (ex. 0 = ![equation](http://www.sciweavers.org/tex2img.php?eq=%20%5Clambda%20f.%20%5Clambda%20x.x&bc=White&fc=Black&im=jpg&fs=12&ff=arev&edit=0) )


========== cs_21_project ==========
[NO README FOUND]


